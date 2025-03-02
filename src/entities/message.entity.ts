import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { SlackUser } from './slack-user.entity';
import { Channel } from './channel.entity';
import { Attachment } from './attachment.entity';
import { MessageContent } from './message-content.entity';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slackMessageId: string;

  @ManyToOne(() => SlackUser, (slackUser) => slackUser.messages)
  @JoinColumn({ name: 'slack_user_id' })
  slackUser: SlackUser;

  @Column({ name: 'slack_user_id' })
  slackUserId: number;

  @ManyToOne(() => Channel, (channel) => channel.messages)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @Column({ name: 'channel_id' })
  channelId: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  threadTs: string;

  @Column({ default: false })
  hasAttachments: boolean;
  
  @Column({ nullable: true })
  contentHash: string;

  @Column({ type: 'jsonb', nullable: true })
  reactions: Record<string, any>;
  
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
  
  @OneToMany(() => Attachment, (attachment) => attachment.message)
  attachments: Attachment[];
  
  @OneToOne(() => MessageContent, (content) => content.message)
  content: MessageContent;
}