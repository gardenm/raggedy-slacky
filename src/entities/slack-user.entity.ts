import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Message } from './message.entity';

@Entity({ name: 'slack_users' })
export class SlackUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slackUserId: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  realName: string;

  @Column({ nullable: true })
  avatar: string;
  
  @Column({ default: false })
  isBot: boolean;
  
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Message, (message) => message.slackUser)
  messages: Message[];
}