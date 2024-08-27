import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity()
export class EmailConfirmation extends BaseEntity {
  @Column()
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => User, user => user.emailConfirmations)
  user: User;

  @Column({ default: false })
  isConfirmed: boolean;
}
