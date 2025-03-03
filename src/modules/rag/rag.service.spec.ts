import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import { LlmService } from './llm.service';
import { SearchService } from '../search/search.service';
import { VectorService } from '../search/vector.service';
import { ChatIntentType } from './dto/chat-response.dto';
import { LlmResponseDto } from './dto/llm-response.dto';

describe('RagService', () => {
  let service: RagService;
  let llmService: LlmService;
  let searchService: SearchService;
  let vectorService: VectorService;

  // Mock data
  const mockUserId = 1;
  const mockChannelIds = [1, 2];
  const mockHistory = ['What is the project about?', 'The project is a Slack archive RAG system.'];
  const mockSearchResults = {
    results: [
      {
        id: 1,
        content: 'We should use NestJS for the backend',
        channelId: 1,
        userId: 1,
        timestamp: '2023-01-01T00:00:00Z',
        channel: { name: 'general' },
        user: { name: 'user1' },
        score: 0.95,
      },
      {
        id: 2,
        content: 'I agree, NestJS is a good choice',
        channelId: 1,
        userId: 2,
        timestamp: '2023-01-01T00:01:00Z',
        channel: { name: 'general' },
        user: { name: 'user2' },
        score: 0.9,
      },
    ],
    total: 2,
  };

  // Mock LLM response
  const mockLlmResponse: LlmResponseDto = {
    content: 'This is a response from the LLM',
    metadata: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 500,
    },
    citations: [
      {
        text: 'We should use NestJS for the backend',
        metadata: {
          channelName: 'general',
          userName: 'user1',
        },
        relevanceScore: 0.95,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: LlmService,
          useValue: {
            generateResponse: jest.fn().mockResolvedValue('Mock response'),
            generateRagResponse: jest.fn().mockResolvedValue(mockLlmResponse),
            generateConversationResponse: jest.fn().mockResolvedValue(mockLlmResponse),
            summarize: jest.fn().mockResolvedValue('Mock summary'),
          },
        },
        {
          provide: SearchService,
          useValue: {
            search: jest.fn().mockResolvedValue(mockSearchResults),
          },
        },
        {
          provide: VectorService,
          useValue: {
            search: jest.fn().mockResolvedValue([
              { content: 'Mock vector search result 1', score: 0.9 },
              { content: 'Mock vector search result 2', score: 0.8 },
            ]),
          },
        },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    llmService = module.get<LlmService>(LlmService);
    searchService = module.get<SearchService>(SearchService);
    vectorService = module.get<VectorService>(VectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should handle search intent queries', async () => {
      const query = 'What framework should we use for the backend?';
      const result = await service.chat(mockUserId, { message: query, channelIds: mockChannelIds });
      
      expect(searchService.search).toHaveBeenCalled();
      expect(llmService.generateRagResponse).toHaveBeenCalled();
      expect(result.intent).toBe(ChatIntentType.SEARCH);
      expect(result.message).toBe(mockLlmResponse.content);
      expect(result.sources).toBe(1);
    });

    it('should handle conversation intent queries', async () => {
      const query = 'Tell me more about that';
      const result = await service.chat(mockUserId, { 
        message: query, 
        history: mockHistory,
        channelIds: mockChannelIds 
      });
      
      expect(llmService.generateConversationResponse).toHaveBeenCalled();
      expect(result.intent).toBe(ChatIntentType.CONVERSATION);
      expect(result.message).toBe(mockLlmResponse.content);
    });

    it('should handle summarization intent queries', async () => {
      const query = 'Summarize the discussion about backend frameworks';
      const result = await service.chat(mockUserId, { 
        message: query, 
        channelIds: mockChannelIds 
      });
      
      expect(searchService.search).toHaveBeenCalled();
      expect(llmService.summarize).toHaveBeenCalled();
      expect(result.intent).toBe(ChatIntentType.SUMMARIZATION);
    });

    it('should handle errors gracefully', async () => {
      // Mock a failure
      jest.spyOn(searchService, 'search').mockRejectedValueOnce(new Error('Search failed'));
      
      const query = 'Find information about testing';
      const result = await service.chat(mockUserId, { message: query });
      
      expect(result.message).toContain('sorry');
      expect(result.intent).toBe(ChatIntentType.CONVERSATION);
      expect(result.sources).toBe(0);
    });
  });

  describe('intent detection', () => {
    it('should detect search intent', async () => {
      const searchQueries = [
        'Find information about NestJS',
        'Search for database discussions',
        'Where can I find the API documentation?',
        'Who said we should use PostgreSQL?',
        'What is the best practice for authentication?',
      ];
      
      for (const query of searchQueries) {
        const result = await service.chat(mockUserId, { message: query });
        expect(result.intent).toBe(ChatIntentType.SEARCH);
      }
    });
    
    it('should detect summarization intent', async () => {
      const summaryQueries = [
        'Summarize the discussion about authentication',
        'Give me a summary of the frontend debate',
        'Can you provide a TLDR of yesterday\'s meeting?',
        'Recap the deployment conversation',
      ];
      
      for (const query of summaryQueries) {
        const result = await service.chat(mockUserId, { message: query });
        expect(result.intent).toBe(ChatIntentType.SUMMARIZATION);
      }
    });
    
    it('should default to conversation intent for ambiguous queries', async () => {
      const conversationQueries = [
        'Hello there',
        'Thanks for the information',
        'Can you elaborate on that?',
        'I don\'t understand',
      ];
      
      for (const query of conversationQueries) {
        const result = await service.chat(mockUserId, { message: query });
        expect(result.intent).toBe(ChatIntentType.CONVERSATION);
      }
    });
  });
});