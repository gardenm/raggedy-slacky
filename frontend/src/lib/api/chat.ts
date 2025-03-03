import apiClient from './client';

export interface ChatRequest {
  message: string;
  history?: string[];
  channelIds?: number[];
}

export interface SourceReference {
  text: string;
  channel?: string;
  user?: string;
  timestamp?: string;
  relevanceScore?: number;
}

export enum ChatIntentType {
  SEARCH = 'search',
  CONVERSATION = 'conversation',
  SUMMARIZATION = 'summarization',
}

export interface ChatResponse {
  message: string;
  intent: ChatIntentType;
  sources: number;
  references?: SourceReference[];
  metadata?: {
    latencyMs?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    model?: string;
  };
  conversationId?: string;
}

export interface ConversationHistory {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

const chatService = {
  /**
   * Send a message to the chat API
   */
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', request);
    return response.data;
  },
  
  /**
   * Get conversation history for the current user
   */
  getConversationHistory: async (limit: number = 10, offset: number = 0) => {
    const response = await apiClient.get('/chat/history', {
      params: { limit, offset },
    });
    return response.data;
  },
  
  /**
   * Get a specific conversation by ID
   */
  getConversation: async (conversationId: string) => {
    const response = await apiClient.get(`/chat/conversation/${conversationId}`);
    return response.data;
  },
};

export default chatService;