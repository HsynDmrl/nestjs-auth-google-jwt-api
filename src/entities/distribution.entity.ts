import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TipSession } from './tip-session.entity';
import { User } from './user.entity';

@Entity()
@Index(['tipSession', 'user', 'currencyCode'])
export class Distribution extends BaseEntity {
  @ManyToOne(() => TipSession, (tipSession) => tipSession.distributions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  tipSession: TipSession;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ length: 3 })
  currencyCode: string;

  @Column({ type: 'int', unsigned: true })
  amountMinorUnit: number;
}
