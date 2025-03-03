import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { LlmService } from './llm.service';
import { VectorService } from '../search/vector.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto, ChatIntentType, SourceReference } from './dto/chat-response.dto';
import { Citation, LlmResponseDto } from './dto/llm-response.dto';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  
  constructor(
    private searchService: SearchService,
    private llmService: LlmService,
    private vectorService: VectorService,
  ) {}

  /**
   * Process a chat request and generate a response
   * This method orchestrates the RAG pipeline
   */
  async chat(userId: number, chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    const { message, history, channelIds } = chatRequest;
    const startTime = Date.now();

    try {
      // Determine the user's intent (search, conversation, or summarization)
      const intent = this.detectIntent(message);
      
      // Process the request based on the detected intent
      switch (intent) {
        case ChatIntentType.SEARCH:
          return await this.handleSearchIntent(userId, message, channelIds, startTime);
        
        case ChatIntentType.SUMMARIZATION:
          return await this.handleSummarizationIntent(userId, message, channelIds, startTime);
        
        case ChatIntentType.CONVERSATION:
        default:
          return await this.handleConversationIntent(userId, message, history, startTime);
      }
    } catch (error) {
      this.logger.error(`Error processing chat request: ${error.message}`, error.stack);
      
      // Return a fallback response in case of error
      return {
        message: "I'm sorry, I encountered an error processing your request. Please try again.",
        intent: ChatIntentType.CONVERSATION,
        sources: 0,
        metadata: {
          latencyMs: Date.now() - startTime,
        }
      };
    }
  }

  /**
   * Handle a search intent by retrieving relevant context and generating a response
   */
  private async handleSearchIntent(
    userId: number, 
    message: string, 
    channelIds?: number[],
    startTime: number = Date.now()
  ): Promise<ChatResponseDto> {
    this.logger.log(`Processing search intent: ${message.substring(0, 100)}...`);
    
    // Get search results from the search service
    const searchRequest = {
      query: message,
      limit: 15, // Retrieve more results for better context
      offset: 0,
      channelIds,
      userId,
    };
    
    // Use the search service to get comprehensive results
    const searchResults = await this.searchService.search(searchRequest);
    
    // Convert search results to context format for RAG
    const contexts = searchResults.results.map(result => ({
      text: result.content,
      metadata: {
        messageId: result.id,
        channelName: result.channel?.name,
        channelId: result.channelId,
        userName: result.user?.name || result.user?.realName,
        userId: result.userId,
        timestamp: result.timestamp,
        threadTs: result.threadTs,
      }
    }));
    
    // Generate RAG response using the LLM service
    const llmResponse = await this.llmService.generateRagResponse(
      message,
      contexts,
      {
        temperature: 0.7,
        maxResponseTokens: 1024,
      }
    );
    
    // Convert to ChatResponseDto format
    return this.formatRagResponse(llmResponse, ChatIntentType.SEARCH, startTime);
  }

  /**
   * Handle a conversation intent by using conversation history
   */
  private async handleConversationIntent(
    userId: number, 
    message: string, 
    history?: string[],
    startTime: number = Date.now()
  ): Promise<ChatResponseDto> {
    this.logger.log(`Processing conversation intent: ${message.substring(0, 100)}...`);
    
    // Convert history to the format expected by the LLM service
    const conversationHistory = history ? this.formatConversationHistory(history) : [];
    
    // Generate conversation response
    const llmResponse = await this.llmService.generateConversationResponse(
      message,
      conversationHistory,
      {
        temperature: 0.8, // Slightly higher for more creative conversation
        maxResponseTokens: 1024,
      }
    );
    
    // Convert to ChatResponseDto format
    return this.formatRagResponse(llmResponse, ChatIntentType.CONVERSATION, startTime);
  }

  /**
   * Handle a summarization intent
   */
  private async handleSummarizationIntent(
    userId: number, 
    message: string, 
    channelIds?: number[],
    startTime: number = Date.now()
  ): Promise<ChatResponseDto> {
    this.logger.log(`Processing summarization intent: ${message.substring(0, 100)}...`);
    
    // Extract the topic from the summarization request
    const topic = this.extractTopic(message);
    
    // Get relevant messages for the summarization topic
    const searchRequest = {
      query: topic,
      limit: 30, // Get more messages for summarization
      offset: 0,
      channelIds,
      userId,
    };
    
    const searchResults = await this.searchService.search(searchRequest);
    
    // Get message contents for summarization
    const messagesToSummarize = searchResults.results.map(r => r.content);
    
    // Generate summary
    const summary = await this.llmService.summarize(messagesToSummarize, topic);
    
    // Convert search results to references
    const references = searchResults.results.map(result => this.createSourceReference(result));
    
    // Create response
    return {
      message: summary,
      intent: ChatIntentType.SUMMARIZATION,
      sources: messagesToSummarize.length,
      references,
      metadata: {
        latencyMs: Date.now() - startTime,
      }
    };
  }

  /**
   * Format the LLM response to the ChatResponseDto format
   */
  private formatRagResponse(
    llmResponse: LlmResponseDto, 
    intent: ChatIntentType,
    startTime: number
  ): ChatResponseDto {
    // Convert citations to source references
    const references = llmResponse.citations?.map(citation => {
      // Extract metadata from citation
      const { metadata = {} } = citation;
      
      // Create source reference
      return {
        text: citation.text,
        channel: metadata.channelName,
        user: metadata.userName,
        timestamp: metadata.timestamp,
        relevanceScore: citation.relevanceScore,
      } as SourceReference;
    });
    
    // Build response
    return {
      message: llmResponse.content,
      intent,
      sources: llmResponse.citations?.length || 0,
      references,
      metadata: {
        ...llmResponse.metadata,
        latencyMs: llmResponse.metadata?.latencyMs || (Date.now() - startTime),
      },
      conversationId: llmResponse.conversationId,
    };
  }

  /**
   * Create a SourceReference from a search result
   */
  private createSourceReference(result: any): SourceReference {
    return {
      text: result.content,
      channel: result.channel?.name,
      user: result.user?.name || result.user?.realName,
      timestamp: result.timestamp,
      relevanceScore: result.score,
    };
  }

  /**
   * Format conversation history for the LLM
   */
  private formatConversationHistory(history: string[]): { role: string; content: string }[] {
    const formattedHistory: { role: string; content: string }[] = [];
    
    // Format each message into a role/content pair
    for (let i = 0; i < history.length; i++) {
      formattedHistory.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: history[i],
      });
    }
    
    return formattedHistory;
  }

  /**
   * Detect the intent of the user's message
   */
  private detectIntent(message: string): ChatIntentType {
    // Check for summarization intent
    if (this.isSummarizationIntent(message)) {
      return ChatIntentType.SUMMARIZATION;
    }
    
    // Check for search intent
    if (this.isSearchIntent(message)) {
      return ChatIntentType.SEARCH;
    }
    
    // Default to conversation
    return ChatIntentType.CONVERSATION;
  }

  /**
   * Determine if this is a search intent
   */
  private isSearchIntent(message: string): boolean {
    const searchPhrases = [
      'find',
      'search',
      'look for',
      'locate',
      'where is',
      'when did',
      'who said',
      'what is',
      'how do',
      'show me',
      'tell me about',
    ];
    
    const searchPattern = /\b(find|search|where|when|what|who|how|show|tell me about)\b/i;
    
    // Check for search phrases or pattern
    return searchPhrases.some(phrase => 
      message.toLowerCase().includes(phrase.toLowerCase())
    ) || searchPattern.test(message);
  }

  /**
   * Determine if this is a summarization intent
   */
  private isSummarizationIntent(message: string): boolean {
    const summarizationPhrases = [
      'summarize',
      'summary',
      'summarization',
      'give me a summary',
      'tldr',
      'recap',
    ];
    
    const summarizationPattern = /\b(summarize|summary|summarization|recap|tldr)\b/i;
    
    // Check for summarization phrases or pattern
    return summarizationPhrases.some(phrase => 
      message.toLowerCase().includes(phrase.toLowerCase())
    ) || summarizationPattern.test(message);
  }

  /**
   * Extract the topic from a summarization request
   */
  private extractTopic(message: string): string {
    // Remove summarization keywords
    const cleanedMessage = message
      .toLowerCase()
      .replace(/\b(summarize|summary|summarization|recap|tldr|give me a summary of)\b/gi, '')
      .trim();
    
    return cleanedMessage;
  }
}