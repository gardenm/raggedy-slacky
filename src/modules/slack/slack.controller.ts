import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SlackService } from './slack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportRequestDto } from './dto/import-request.dto';

@Controller('admin/slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @UseGuards(JwtAuthGuard)
  @Post('import')
  async importData(@Body() importRequest: ImportRequestDto) {
    return this.slackService.importData(importRequest);
  }
}