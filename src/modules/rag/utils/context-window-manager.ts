import { MessageRole, Message } from '../dto/llm-request.dto';
import { TokenCounter } from './token-counter';

/**
 * Manages context window to ensure token limits are respected
 */
export class ContextWindowManager {
  // Default token limits for different model sizes
  private static readonly DEFAULT_MAX_TOKENS = 4096;
  private static readonly RESERVED_TOKENS = 200; // Reserve tokens for the model response
  
  /**
   * Trim context to fit within token limits
   * This ensures the prompt + context + reserved tokens stays under the model's context window
   */
  static fitContextToTokenLimit(
    context: string[],
    options: { 
      maxTokens?: number; 
      reservedTokens?: number;
      systemPrompt?: string;
      userPrompt?: string;
    } = {}
  ): string[] {
    const { 
      maxTokens = this.DEFAULT_MAX_TOKENS,
      reservedTokens = this.RESERVED_TOKENS,
      systemPrompt = '',
      userPrompt = '',
    } = options;
    
    // Calculate available tokens
    const availableTokens = maxTokens - reservedTokens;
    
    // Calculate tokens used by the system and user prompts
    const systemPromptTokens = TokenCounter.estimateTokenCount(systemPrompt);
    const userPromptTokens = TokenCounter.estimateTokenCount(userPrompt);
    const promptOverheadTokens = 10; // Overhead for message formatting
    
    // Calculate tokens remaining for context
    const availableForContext = availableTokens - systemPromptTokens - userPromptTokens - promptOverheadTokens;
    
    if (availableForContext <= 0) {
      // No room for context
      return [];
    }
    
    // Track how many tokens we've used
    let usedTokens = 0;
    const trimmedContext: string[] = [];
    
    // Add items to context until we reach the limit
    for (const item of context) {
      const itemTokens = TokenCounter.estimateTokenCount(item);
      
      if (usedTokens + itemTokens <= availableForContext) {
        trimmedContext.push(item);
        usedTokens += itemTokens;
      } else {
        // Try to fit a trimmed version if the full item doesn't fit
        const remainingTokens = availableForContext - usedTokens;
        if (remainingTokens > 50) { // Only include if we can fit meaningful content
          const trimmedItem = TokenCounter.truncateToTokenLimit(item, remainingTokens);
          trimmedContext.push(trimmedItem);
        }
        break;
      }
    }
    
    return trimmedContext;
  }
  
  /**
   * Fit conversation history to token limits
   * This preserves the most recent messages while trimming older ones if needed
   */
  static fitConversationToTokenLimit(
    messages: Message[],
    options: { 
      maxTokens?: number; 
      reservedTokens?: number;
    } = {}
  ): Message[] {
    const {
      maxTokens = this.DEFAULT_MAX_TOKENS,
      reservedTokens = this.RESERVED_TOKENS,
    } = options;
    
    // Calculate available tokens
    const availableTokens = maxTokens - reservedTokens;
    
    // Start with system message if present
    const systemMessage = messages.find(m => m.role === MessageRole.SYSTEM);
    const nonSystemMessages = messages.filter(m => m.role !== MessageRole.SYSTEM);
    
    // Always keep system message if present
    const trimmedMessages: Message[] = systemMessage ? [systemMessage] : [];
    let usedTokens = systemMessage 
      ? TokenCounter.estimateTokenCount(systemMessage.content) + 5 // role overhead
      : 0;
    
    // Add most recent messages first (in reverse order)
    const reversedMessages = [...nonSystemMessages].reverse();
    
    for (const message of reversedMessages) {
      const messageTokens = TokenCounter.estimateTokenCount(message.content);
      const messageOverhead = 5; // Overhead for message formatting
      
      if (usedTokens + messageTokens + messageOverhead <= availableTokens) {
        // Message fits, add it to the beginning (to maintain order)
        trimmedMessages.unshift(message);
        usedTokens += messageTokens + messageOverhead;
      } else {
        // Message doesn't fit, try trimming it
        const remainingTokens = availableTokens - usedTokens - messageOverhead;
        if (remainingTokens > 50) { // Only include if we can fit meaningful content
          const trimmedContent = TokenCounter.truncateToTokenLimit(message.content, remainingTokens);
          trimmedMessages.unshift({
            role: message.role,
            content: trimmedContent,
          });
        }
        break;
      }
    }
    
    // Ensure system message is first if it exists
    if (systemMessage && trimmedMessages.length > 1) {
      const systemIndex = trimmedMessages.findIndex(m => m.role === MessageRole.SYSTEM);
      if (systemIndex > 0) {
        const [system] = trimmedMessages.splice(systemIndex, 1);
        trimmedMessages.unshift(system);
      }
    }
    
    return trimmedMessages;
  }
}