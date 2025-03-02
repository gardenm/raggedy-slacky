import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity({ name: 'channels' })
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slackChannelId: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  purpose: string;

  @Column()
  isPrivate: boolean;
  
  @Column({ default: false })
  isArchived: boolean;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Message, (message) => message.channel)
  messages: Message[];
}