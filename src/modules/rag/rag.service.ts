import { Injectable } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { LlmService } from './llm.service';
import { VectorService } from '../search/vector.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Injectable()
export class RagService {
  constructor(
    private searchService: SearchService,
    private llmService: LlmService,
    private vectorService: VectorService,
  ) {}

  async chat(userId: number, chatRequest: ChatRequestDto) {
    const { message, history, channelIds } = chatRequest;

    // Determine if this is a general question or a search query
    const isSearchIntent = this.isSearchIntent(message);
    
    let context: string[] = [];

    if (isSearchIntent) {
      // For search intents, get relevant messages from the vector database
      const searchRequest = {
        query: message,
        limit: 10,
        offset: 0,
        channelIds,
      };

      // Get context from vector search
      const searchResults = await this.vectorService.search(message, 10);
      context = searchResults.map(result => result.content);
    } else if (history && history.length > 0) {
      // For conversational intents, use the conversation history as context
      context = history;
    }

    // Generate system prompt based on intent
    const systemPrompt = isSearchIntent
      ? this.generateSearchSystemPrompt()
      : this.generateConversationSystemPrompt();

    // Generate response using LLM
    const response = await this.llmService.generateResponse(
      message,
      context,
      systemPrompt,
    );

    return {
      message: response,
      sources: isSearchIntent ? context.length : 0,
      intent: isSearchIntent ? 'search' : 'conversation',
    };
  }

  private isSearchIntent(message: string): boolean {
    // Simple heuristic to determine if this is a search intent
    // In a real implementation, this would be more sophisticated
    const searchPhrases = [
      'find',
      'search',
      'look for',
      'where is',
      'when did',
      'who said',
      'what is',
      'how do',
    ];
    
    return searchPhrases.some(phrase => 
      message.toLowerCase().includes(phrase.toLowerCase())
    );
  }

  private generateSearchSystemPrompt(): string {
    return `You are a helpful assistant providing information from a Slack archive.
Use the provided context to answer the user's question.
If you can't find the answer in the context, say so.
Cite specific messages when appropriate.
Keep your answers concise and to the point.`;
  }

  private generateConversationSystemPrompt(): string {
    return `You are a helpful assistant chatting with the user.
Use the conversation history for context.
Be friendly, concise, and helpful.
If the user asks about the Slack archive, encourage them to use search terms like "find" or "search for".`;
  }
}