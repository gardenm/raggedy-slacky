import { LlmRequestDto, Message, MessageRole } from '../dto/llm-request.dto';
import { LlmResponseDto } from '../dto/llm-response.dto';
import axios from 'axios';
import { TokenCounter } from './token-counter';

/**
 * Client for interacting with Llama 3 API
 * This is a simple adapter for the Ollama API (https://github.com/ollama/ollama)
 * but can be modified to work with any Llama 3 provider
 */
export class LlamaClient {
  private apiUrl: string;
  private modelName: string;
  private timeoutMs: number;
  
  constructor(
    options: {
      apiUrl: string; 
      modelName: string;
      timeoutMs?: number;
    }
  ) {
    this.apiUrl = options.apiUrl;
    this.modelName = options.modelName;
    this.timeoutMs = options.timeoutMs || 30000;
  }
  
  /**
   * Generate a response from the LLM
   */
  async generateCompletion(request: LlmRequestDto): Promise<LlmResponseDto> {
    try {
      const startTime = Date.now();
      
      // Map the messages to the format expected by the Ollama API
      const messages = request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Calculate token usage for prompt
      const promptTokens = TokenCounter.estimateChatTokens(messages);
      
      // Make the API request
      const response = await axios.post(
        `${this.apiUrl}/api/chat`, 
        {
          model: request.options?.model || this.modelName,
          messages,
          stream: false,
          options: {
            temperature: request.options?.temperature,
            top_p: request.options?.topP,
            max_tokens: request.options?.maxTokens,
          },
        },
        { timeout: this.timeoutMs }
      );
      
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Calculate token usage for completion
      const completionText = response.data.message?.content || '';
      const completionTokens = TokenCounter.estimateTokenCount(completionText);
      
      // Prepare the response
      return {
        content: completionText,
        metadata: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          model: this.modelName,
          latencyMs,
        },
        conversationId: request.conversationId,
      };
    } catch (error) {
      console.error('Error calling Llama API:', error);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }
  
  /**
   * Mock method for development/testing when API is not available
   */
  async mockCompletion(request: LlmRequestDto): Promise<LlmResponseDto> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userMessages = request.messages
      .filter(m => m.role === MessageRole.USER)
      .map(m => m.content);
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Calculate token usage
    const promptTokens = TokenCounter.estimateChatTokens(request.messages);
    
    // Generate a mock response based on the input
    const mockResponse = `This is a mock response to your query: "${lastUserMessage.substring(0, 50)}..."\n\nIn a real implementation, this would come from the Llama 3 API.`;
    const completionTokens = TokenCounter.estimateTokenCount(mockResponse);
    
    return {
      content: mockResponse,
      metadata: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        model: 'llama3-mock',
        latencyMs: 500,
      },
      conversationId: request.conversationId,
    };
  }
}