import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { RagService } from './rag.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('chat')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async chat(@Request() req, @Body() chatRequest: ChatRequestDto) {
    return this.ragService.chat(req.user.userId, chatRequest);
  }
}