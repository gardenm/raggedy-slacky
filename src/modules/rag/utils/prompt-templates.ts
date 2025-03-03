import { MessageRole } from '../dto/llm-request.dto';

/**
 * Prompt templates for different use cases
 */
export class PromptTemplates {
  /**
   * Generate a system prompt for RAG (Retrieval Augmented Generation)
   */
  static generateRagSystemPrompt(options: { includeTimestamps?: boolean } = {}): string {
    const { includeTimestamps = true } = options;
    
    return `You are a helpful assistant with access to a Slack archive. Answer the user's questions based on the retrieved context.

RULES:
1. If the answer can be found in the context, provide it concisely.
2. If the answer cannot be found in the context, say "I don't have information about that in the Slack archive."
3. Always prioritize information from the context over your general knowledge.
4. Cite message sources when appropriate with [Channel: channel_name].
5. Format code blocks properly with the appropriate language syntax highlighting.
6. Keep responses concise and focused on the question.
${includeTimestamps ? '7. When relevant, include timestamps to indicate when information was discussed.' : ''}

When analyzing the context, remember that Slack conversations are often informal and may contain:
- Abbreviations and company-specific jargon
- Multiple people discussing topics simultaneously
- Thread replies that may provide important clarifications
- Questions that were asked but never answered`;
  }
  
  /**
   * Generate a system prompt for conversation (no retrieval)
   */
  static generateConversationSystemPrompt(): string {
    return `You are a helpful assistant chatting with a user about their Slack workspace.

RULES:
1. Be friendly, helpful, and concise.
2. If the user asks about specific information from Slack that you don't have, suggest they try a search query.
3. Format code blocks properly with the appropriate language syntax highlighting.
4. Keep your responses concise and to the point.
5. If the user seems to be looking for information, suggest they use search terms like "find", "search for", etc.`;
  }
  
  /**
   * Generate a system prompt for summarization
   */
  static generateSummarizationSystemPrompt(options: { topic?: string } = {}): string {
    const { topic } = options;
    
    return `You are a helpful assistant summarizing Slack conversations.

Your task is to create a concise summary of the conversation${topic ? ` about "${topic}"` : ''}.

RULES:
1. Focus on the key points, decisions, and action items.
2. Maintain a neutral, objective tone.
3. Be concise but comprehensive.
4. Include the names of participants when they make important points.
5. Structure your summary with clear sections if appropriate.
6. If there are unresolved questions or topics, note them at the end.`;
  }
  
  /**
   * Create a complete RAG prompt with context
   */
  static createRagPrompt(
    userQuery: string,
    context: string[],
    options: { maxContextItems?: number } = {}
  ) {
    const { maxContextItems = 10 } = options;
    
    // Limit context to prevent exceeding token limits
    const limitedContext = context.slice(0, maxContextItems);
    
    const messages = [
      {
        role: MessageRole.SYSTEM,
        content: this.generateRagSystemPrompt(),
      },
      {
        role: MessageRole.USER,
        content: `I need information from the Slack archive. Here's my question:

${userQuery}

Here is the relevant context from the Slack archive:
${limitedContext.map((item, i) => `[${i + 1}] ${item}`).join('\n\n')}

Please answer based on this context.`,
      },
    ];
    
    return messages;
  }
  
  /**
   * Create a conversation prompt (without retrieval)
   */
  static createConversationPrompt(
    userMessage: string,
    history: { role: string; content: string }[] = []
  ) {
    const messages = [
      {
        role: MessageRole.SYSTEM,
        content: this.generateConversationSystemPrompt(),
      },
      ...history.map(h => ({
        role: h.role as MessageRole,
        content: h.content,
      })),
      {
        role: MessageRole.USER,
        content: userMessage,
      },
    ];
    
    return messages;
  }
  
  /**
   * Create a summarization prompt
   */
  static createSummarizationPrompt(
    messages: string[],
    topic: string
  ) {
    return [
      {
        role: MessageRole.SYSTEM,
        content: this.generateSummarizationSystemPrompt({ topic }),
      },
      {
        role: MessageRole.USER,
        content: `Please summarize the following Slack conversation ${topic ? `about "${topic}"` : ''}:

${messages.join('\n\n')}

Create a concise summary that captures the main points, decisions, and any action items.`,
      },
    ];
  }
}