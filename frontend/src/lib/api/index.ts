import authService from './auth';
import searchService from './search';
import chatService from './chat';
import apiClient from './client';

export {
  authService,
  searchService,
  chatService,
  apiClient,
};

// Re-export types
export type { LoginCredentials, RegisterData, AuthResponse } from './auth';
export type { 
  ChatRequest, 
  ChatResponse, 
  SourceReference, 
  ConversationHistory,
} from './chat';
export { ChatIntentType } from './chat';
export type {
  SearchRequest,
  SearchResponse,
  SearchResultMessage,
  Channel,
  SlackUser,
} from './search';