import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { TipEntry } from './tip-entry.entity';
import { Distribution } from './distribution.entity';

export enum TipSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity()
export class TipSession extends BaseEntity {
  @Column({ length: 150 })
  name: string;

  @Column({ type: 'datetime' })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  endedAt?: Date;

  @Column({
    type: 'enum',
    enum: TipSessionStatus,
    default: TipSessionStatus.OPEN,
  })
  status: TipSessionStatus;

  @Column({ type: 'simple-json', nullable: true })
  openingCarryOverByCurrency?: Record<string, number>;

  @Column({ type: 'simple-json', nullable: true })
  closingCarryOverByCurrency?: Record<string, number>;

  @ManyToMany(() => User)
  @JoinTable({ name: 'tip_session_participants' })
  participants: User[];

  @OneToMany(() => TipEntry, (tipEntry) => tipEntry.tipSession)
  tipEntries: TipEntry[];

  @OneToMany(() => Distribution, (distribution) => distribution.tipSession)
  distributions: Distribution[];
}
