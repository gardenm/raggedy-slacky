import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity({ name: 'attachments' })
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Message, (message) => message.attachments)
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ name: 'message_id' })
  messageId: number;

  @Column()
  slackFileId: string;

  @Column()
  filename: string;

  @Column()
  filetype: string;

  @Column({ type: 'int', nullable: true })
  filesize: number;

  @Column({ nullable: true })
  urlPrivate: string;

  @Column({ nullable: true })
  localPath: string;

  @Column({ nullable: true })
  thumbnailPath: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}