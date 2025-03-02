import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserQuery } from './user-query.entity';
import { Conversation } from './conversation.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  lastLogin: Date;
  
  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => UserQuery, (userQuery) => userQuery.user)
  queries: UserQuery[];
  
  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations: Conversation[];
}