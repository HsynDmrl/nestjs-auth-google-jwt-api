import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity()
export class PasswordReset extends BaseEntity {
  @Column()
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => User, user => user.passwordResets)
  user: User;

  @Column({ default: false })
  used: boolean;
}
