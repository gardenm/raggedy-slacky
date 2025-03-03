/**
 * Token counter utility
 * 
 * This is a simple approximation for token counting based on common tokenizer behavior.
 * In a production environment, you should use a proper tokenizer like tiktoken or a model-specific tokenizer.
 */
export class TokenCounter {
  // Approximation: English text is roughly 4 chars per token on average
  private static CHARS_PER_TOKEN = 4;
  
  /**
   * Estimate the number of tokens in a text string
   */
  static estimateTokenCount(text: string): number {
    if (!text) return 0;
    
    // Remove extra spaces to get a more accurate count
    const normalizedText = text.trim().replace(/\s+/g, ' ');
    
    return Math.ceil(normalizedText.length / this.CHARS_PER_TOKEN);
  }
  
  /**
   * Estimate the number of tokens in a chat message array
   * Chat message format is typically [{role: "system", content: "..."}, {role: "user", content: "..."}, ...]
   */
  static estimateChatTokens(messages: { role: string; content: string }[]): number {
    if (!messages || messages.length === 0) return 0;
    
    let totalTokens = 0;
    
    // Add per-message overhead (most models have a small overhead per message)
    const messageOverhead = 4; // tokens per message
    
    for (const message of messages) {
      // Add role overhead (approximate)
      totalTokens += message.role.length; 
      
      // Add message content tokens
      totalTokens += this.estimateTokenCount(message.content);
      
      // Add message overhead
      totalTokens += messageOverhead;
    }
    
    // Add conversation overhead
    totalTokens += 2; // start and end tokens
    
    return totalTokens;
  }
  
  /**
   * Truncate text to fit within a token limit
   */
  static truncateToTokenLimit(text: string, maxTokens: number): string {
    if (!text) return '';
    
    const estimatedTokens = this.estimateTokenCount(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    // Approximate how many characters we need to remove
    const approxCharLimit = maxTokens * this.CHARS_PER_TOKEN;
    
    // Leave some margin to account for the approximation
    const safeCharLimit = Math.floor(approxCharLimit * 0.9);
    
    return text.substring(0, safeCharLimit) + '...';
  }
}