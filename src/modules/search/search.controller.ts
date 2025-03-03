import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Query, 
  Request, 
  UseGuards 
} from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchRequestDto } from './dto/search-request.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Main search endpoint
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async search(@Request() req: any, @Body() searchRequest: SearchRequestDto) {
    return this.searchService.search(req.user.userId, searchRequest);
  }

  /**
   * Get all channels for filter options
   */
  @UseGuards(JwtAuthGuard)
  @Get('channels')
  async getChannels() {
    return this.searchService.getChannels();
  }

  /**
   * Get all Slack users for filter options
   */
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getSlackUsers() {
    return this.searchService.getSlackUsers();
  }
  
  /**
   * Get user's search history
   */
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getSearchHistory(
    @Request() req: any,
    @Query('limit') limit = 20
  ) {
    return this.searchService.getUserQueryHistory(req.user.userId, limit);
  }
  
  /**
   * Get thread context for a message
   */
  @UseGuards(JwtAuthGuard)
  @Get('thread/:messageId')
  async getThreadContext(@Param('messageId') messageId: string) {
    return this.searchService.getThreadContext(messageId);
  }
  
  /**
   * Get similar messages to a specific message
   */
  @UseGuards(JwtAuthGuard)
  @Get('similar/:messageId')
  async getSimilarMessages(
    @Param('messageId') messageId: string,
    @Query('limit') limit = 10
  ) {
    return this.searchService.getSimilarMessages(messageId, limit);
  }
  
  /**
   * Search within a specific thread
   */
  @UseGuards(JwtAuthGuard)
  @Get('thread/:threadId/search')
  async searchInThread(
    @Param('threadId') threadId: string,
    @Query('query') query: string
  ) {
    return this.searchService.searchInThread(threadId, query);
  }
}