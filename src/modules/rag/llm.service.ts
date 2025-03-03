import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlamaClient } from './utils/llama-client';
import { ContextWindowManager } from './utils/context-window-manager';
import { PromptTemplates } from './utils/prompt-templates';
import { TokenCounter } from './utils/token-counter';
import { 
  LlmRequestDto, 
  LlmRequestOptions, 
  Message, 
  MessageRole 
} from './dto/llm-request.dto';
import { Citation, LlmResponseDto } from './dto/llm-response.dto';

/**
 * Provides a unified interface for interacting with LLM models
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly llamaClient: LlamaClient;
  private readonly mockMode: boolean;
  
  // Default model settings
  private readonly defaultModelName: string;
  private readonly defaultMaxTokens: number;
  private readonly defaultContextWindow: number;
  
  constructor(private configService: ConfigService) {
    // Load configuration
    const apiUrl = this.configService.get<string>('LLM_API_URL', 'http://localhost:11434');
    this.defaultModelName = this.configService.get<string>('LLM_MODEL_NAME', 'llama3');
    this.defaultMaxTokens = this.configService.get<number>('LLM_MAX_TOKENS', 2048);
    this.defaultContextWindow = this.configService.get<number>('LLM_CONTEXT_WINDOW', 8192);
    this.mockMode = this.configService.get<string>('LLM_MOCK_MODE', 'true') === 'true';
    
    // Initialize LLM client
    this.llamaClient = new LlamaClient({
      apiUrl,
      modelName: this.defaultModelName,
      timeoutMs: this.configService.get<number>('LLM_TIMEOUT_MS', 60000),
    });
    
    this.logger.log(`LLM Service initialized with model: ${this.defaultModelName}`);
    if (this.mockMode) {
      this.logger.warn('Running in mock mode - no actual LLM API calls will be made');
    }
  }

  /**
   * Generate a response from the LLM using the specified prompt and context
   */
  async generateResponse(
    prompt: string,
    context: string[] = [],
    systemPrompt?: string,
    options?: Partial<LlmRequestOptions>
  ): Promise<string> {
    try {
      // Prepare system prompt
      const finalSystemPrompt = systemPrompt || PromptTemplates.generateRagSystemPrompt();
      
      // Fit context to available token limit
      const maxTokens = options?.maxTokens || this.defaultMaxTokens;
      const contextWindow = options?.model?.includes('70b') ? 32000 : this.defaultContextWindow;
      
      const fittedContext = ContextWindowManager.fitContextToTokenLimit(
        context,
        {
          maxTokens: contextWindow,
          reservedTokens: maxTokens + 200, // Reserve tokens for response + overhead
          systemPrompt: finalSystemPrompt,
          userPrompt: prompt,
        }
      );
      
      // Construct messages array for the request
      const messages: Message[] = [
        {
          role: MessageRole.SYSTEM,
          content: finalSystemPrompt,
        },
        {
          role: MessageRole.USER,
          content: this.formatPromptWithContext(prompt, fittedContext),
        },
      ];
      
      // Make the request
      const request: LlmRequestDto = {
        messages,
        options: {
          temperature: options?.temperature ?? 0.7,
          topP: options?.topP ?? 0.95,
          maxTokens: maxTokens,
          model: options?.model ?? this.defaultModelName,
        },
      };
      
      // Generate completion (or use mock in development)
      const response = this.mockMode
        ? await this.llamaClient.mockCompletion(request)
        : await this.llamaClient.generateCompletion(request);
      
      // Log token usage
      this.logger.debug(`Token usage - Prompt: ${response.metadata.promptTokens}, Completion: ${response.metadata.completionTokens}, Total: ${response.metadata.totalTokens}`);
      
      return response.content;
    } catch (error) {
      this.logger.error(`Error generating response: ${error.message}`);
      return `I'm sorry, but I encountered an error while generating a response. ${this.mockMode ? 'This is a development mock mode message.' : 'Please try again later.'}`;
    }
  }

  /**
   * Generate a response using RAG with multiple contexts
   * This handles the prompt generation, context selection, and LLM call
   */
  async generateRagResponse(
    query: string,
    contexts: { text: string; metadata?: any }[] = [],
    options?: {
      temperature?: number;
      maxResponseTokens?: number;
      conversationId?: string;
    }
  ): Promise<LlmResponseDto> {
    const startTime = Date.now();
    try {
      
      // Extract just the text for context fitting
      const contextTexts = contexts.map(c => c.text);
      
      // Create messages with RAG template
      const messages = PromptTemplates.createRagPrompt(
        query,
        contextTexts,
        { maxContextItems: 15 }
      );
      
      // Prepare request
      const request: LlmRequestDto = {
        messages,
        options: {
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxResponseTokens ?? 1024,
          model: this.defaultModelName,
        },
        conversationId: options?.conversationId,
      };
      
      // Generate completion
      const response = this.mockMode
        ? await this.llamaClient.mockCompletion(request)
        : await this.llamaClient.generateCompletion(request);
      
      // Add citations
      const citations: Citation[] = contexts.map((context, index) => ({
        text: context.text,
        metadata: context.metadata || {},
        relevanceScore: 1 - (index * 0.05), // Simple relevance scoring
      }));
      
      response.citations = citations;
      
      // Log performance
      const duration = Date.now() - startTime;
      this.logger.log(`RAG response generated in ${duration}ms with ${contexts.length} context items`);
      
      return response;
    } catch (error) {
      this.logger.error(`Error in RAG response generation: ${error.message}`);
      
      // Return fallback response
      return {
        content: `I'm sorry, but I encountered an error while generating a response. ${this.mockMode ? 'This is a development mock mode message.' : 'Please try again later.'}`,
        metadata: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          model: this.defaultModelName,
          latencyMs: Date.now() - startTime,
        },
      };
    }
  }
  
  /**
   * Generate a conversational response (without RAG context)
   */
  async generateConversationResponse(
    userMessage: string,
    conversationHistory: { role: string; content: string }[] = [],
    options?: {
      temperature?: number;
      maxResponseTokens?: number;
      conversationId?: string;
    }
  ): Promise<LlmResponseDto> {
    const startTime = Date.now();
    try {
      
      // Create conversation prompt
      const messages = PromptTemplates.createConversationPrompt(
        userMessage,
        conversationHistory
      );
      
      // Trim conversation history to fit token limits
      const contextWindow = 8192;
      const fittedMessages = ContextWindowManager.fitConversationToTokenLimit(
        messages,
        {
          maxTokens: contextWindow,
          reservedTokens: (options?.maxResponseTokens || 1024) + 200,
        }
      );
      
      // Prepare request
      const request: LlmRequestDto = {
        messages: fittedMessages,
        options: {
          temperature: options?.temperature ?? 0.8, // Slightly higher temperature for conversation
          maxTokens: options?.maxResponseTokens ?? 1024,
          model: this.defaultModelName,
        },
        conversationId: options?.conversationId,
      };
      
      // Generate completion
      const response = this.mockMode
        ? await this.llamaClient.mockCompletion(request)
        : await this.llamaClient.generateCompletion(request);
      
      // Log performance
      const duration = Date.now() - startTime;
      this.logger.log(`Conversation response generated in ${duration}ms with ${fittedMessages.length} messages`);
      
      return response;
    } catch (error) {
      this.logger.error(`Error in conversation response: ${error.message}`);
      
      // Return fallback response
      return {
        content: `I'm sorry, but I encountered an error while generating a response. ${this.mockMode ? 'This is a development mock mode message.' : 'Please try again later.'}`,
        metadata: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          model: this.defaultModelName,
          latencyMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Summarize a collection of messages about a topic
   */
  async summarize(
    messages: string[],
    topic: string
  ): Promise<string> {
    try {
      // Create summarization prompt
      const promptMessages = PromptTemplates.createSummarizationPrompt(
        messages,
        topic
      );
      
      // Prepare request
      const request: LlmRequestDto = {
        messages: promptMessages,
        options: {
          temperature: 0.3, // Lower temperature for factual summarization
          maxTokens: 1024,
          model: this.defaultModelName,
        },
      };
      
      // Generate completion
      const response = this.mockMode
        ? await this.llamaClient.mockCompletion(request)
        : await this.llamaClient.generateCompletion(request);
      
      return response.content;
    } catch (error) {
      this.logger.error(`Error summarizing messages: ${error.message}`);
      return `I'm sorry, but I encountered an error while generating a summary. ${this.mockMode ? 'This is a development mock mode message.' : 'Please try again later.'}`;
    }
  }
  
  /**
   * Format a prompt with context for the LLM
   */
  private formatPromptWithContext(prompt: string, context: string[]): string {
    if (!context || context.length === 0) {
      return prompt;
    }
    
    return `I need information about the following question:

${prompt}

Here is the relevant context:
${context.map((c, i) => `[${i+1}] ${c}`).join('\n\n')}

Please answer the question based on the context provided.`;
  }
}