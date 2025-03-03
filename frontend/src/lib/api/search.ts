import apiClient from './client';

export interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  channelIds?: number[];
  userIds?: number[];
  startDate?: string;
  endDate?: string;
  includeThreads?: boolean;
}

export interface SearchResultMessage {
  id: number;
  content: string;
  userId: number;
  channelId: number;
  timestamp: string;
  threadTs?: string;
  hasAttachments: boolean;
  score: number;
  channel?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    realName?: string;
  };
}

export interface SearchResponse {
  results: SearchResultMessage[];
  total: number;
  metadata?: {
    executionTimeMs: number;
    searchType: 'vector' | 'text' | 'hybrid';
  };
}

export interface Channel {
  id: number;
  name: string;
  purpose?: string;
  isPrivate: boolean;
}

export interface SlackUser {
  id: number;
  slackUserId: string;
  username: string;
  realName?: string;
  avatar?: string;
}

const searchService = {
  /**
   * Search the Slack archive
   */
  search: async (request: SearchRequest): Promise<SearchResponse> => {
    const response = await apiClient.post<SearchResponse>('/search', request);
    return response.data;
  },
  
  /**
   * Get available channels
   */
  getChannels: async (): Promise<Channel[]> => {
    const response = await apiClient.get<Channel[]>('/channels');
    return response.data;
  },
  
  /**
   * Get Slack users in the archive
   */
  getUsers: async (): Promise<SlackUser[]> => {
    const response = await apiClient.get<SlackUser[]>('/users');
    return response.data;
  },
  
  /**
   * Get a specific message with context
   */
  getMessage: async (messageId: number): Promise<{
    message: SearchResultMessage;
    context: SearchResultMessage[];
  }> => {
    const response = await apiClient.get(`/messages/${messageId}`);
    return response.data;
  },
  
  /**
   * Get an entire thread of messages
   */
  getThread: async (threadTs: string): Promise<SearchResultMessage[]> => {
    const response = await apiClient.get(`/threads/${threadTs}`);
    return response.data;
  },
};

export default searchService;