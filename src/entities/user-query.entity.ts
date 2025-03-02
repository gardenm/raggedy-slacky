import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_queries' })
export class UserQuery {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.queries)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'text' })
  query: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  results: Record<string, any>;
  
  @Column({ default: false })
  isConversational: boolean;
  
  @Column({ nullable: true })
  sessionId: string;
}