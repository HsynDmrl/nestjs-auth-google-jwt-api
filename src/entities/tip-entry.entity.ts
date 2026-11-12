import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TipSession } from './tip-session.entity';

@Entity()
@Index(['tipSession', 'currencyCode'])
export class TipEntry extends BaseEntity {
  @ManyToOne(() => TipSession, (tipSession) => tipSession.tipEntries, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  tipSession: TipSession;

  @Column({ length: 3 })
  currencyCode: string;

  @Column({ type: 'int' })
  amountMinorUnit: number;

  @Column({ length: 255, nullable: true })
  note?: string;
}
