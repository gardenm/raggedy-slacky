import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SlackService } from './slack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportRequestDto } from './dto/import-request.dto';
import { IndexingService } from './indexing.service';

@Controller('admin/slack')
export class SlackController {
  constructor(
    private readonly slackService: SlackService,
    private readonly indexingService: IndexingService,
  ) {}

  /**
   * Import data from a Slack export
   * This endpoint processes all users, channels, and messages
   */
  @UseGuards(JwtAuthGuard)
  @Post('import')
  async importData(@Body() importRequest: ImportRequestDto) {
    return this.slackService.importData(importRequest);
  }

  /**
   * Get statistics about the indexed data
   */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats() {
    return this.slackService.getStats();
  }

  /**
   * Reset all indexed data
   * This will remove all data from the system
   */
  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetData() {
    await this.indexingService.resetData();
    return {
      success: true,
      message: 'All data has been reset',
    };
  }
}