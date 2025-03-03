import { 
  Body, 
  Controller, 
  Post, 
  Get,
  Param,
  Request, 
  UseGuards, 
  Logger,
  Query 
} from '@nestjs/common';
import { RagService } from './rag.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto, ChatIntentType } from './dto/chat-response.dto';

@Controller('chat')
export class RagController {
  private readonly logger = new Logger(RagController.name);
  
  constructor(private readonly ragService: RagService) {}

  /**
   * Main chat endpoint for handling all types of queries (search, conversation, summarization)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async chat(@Request() req: any, @Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    this.logger.log(`Chat request received from user ${req.user.userId}: ${chatRequest.message.substring(0, 100)}...`);
    
    // Track usage for analytics (non-blocking)
    this.trackChatRequest(req.user.userId, chatRequest).catch(error => {
      this.logger.error(`Failed to track chat request: ${error.message}`);
    });
    
    // Process the chat request
    const response = await this.ragService.chat(req.user.userId, chatRequest);
    
    // Log the response intent and performance
    this.logger.log(
      `Chat response generated with intent ${response.intent} in ${response.metadata?.latencyMs || 0}ms`
    );
    
    return response;
  }

  /**
   * Endpoint to retrieve conversation history for a user
   */
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getConversationHistory(
    @Request() req: any,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0
  ) {
    // TODO: Implement conversation history retrieval from database
    // This would retrieve past conversations for the current user
    return {
      conversations: [],
      total: 0,
      limit,
      offset
    };
  }

  /**
   * Endpoint to get a specific conversation by ID
   */
  @UseGuards(JwtAuthGuard)
  @Get('conversation/:id')
  async getConversation(@Request() req: any, @Param('id') conversationId: string) {
    // TODO: Implement conversation retrieval from database
    // This would retrieve all messages in a specific conversation
    return {
      id: conversationId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Track chat requests for analytics (non-blocking)
   * This could store queries to the database for usage analytics
   */
  private async trackChatRequest(userId: number, chatRequest: ChatRequestDto): Promise<void> {
    // TODO: Implement tracking of chat requests
    // This would store the query, timestamp, and user ID in a database
    // Could be used for analytics, improving the model, etc.
    return Promise.resolve();
  }
}