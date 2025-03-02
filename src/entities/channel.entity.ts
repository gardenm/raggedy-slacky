import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Message } from './message.entity';

@Entity({ name: 'channels' })
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slackChannelId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  purpose: string;

  @Column()
  isPrivate: boolean;

  @OneToMany(() => Message, (message) => message.channel)
  messages: Message[];
}