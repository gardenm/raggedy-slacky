import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchRequestDto } from './dto/search-request.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async search(@Request() req, @Body() searchRequest: SearchRequestDto) {
    return this.searchService.search(req.user.userId, searchRequest);
  }

  @UseGuards(JwtAuthGuard)
  @Get('channels')
  async getChannels() {
    return this.searchService.getChannels();
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getSlackUsers() {
    return this.searchService.getSlackUsers();
  }
}