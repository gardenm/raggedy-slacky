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

  @OneToMany(() => Message, (message) => message.slackUser)
  messages: Message[];
}