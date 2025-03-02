import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity({ name: 'message_contents' })
export class MessageContent {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Message, (message) => message.content)
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ name: 'message_id' })
  messageId: number;

  @Column({ type: 'text' })
  rawContent: string;

  @Column({ type: 'text', nullable: true })
  plainContent: string;

  @Column({ type: 'text', nullable: true })
  processedContent: string;
}