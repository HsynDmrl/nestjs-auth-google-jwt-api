import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum AccountBlacklistReason {
  USER_REQUESTED_DELETION = 'USER_REQUESTED_DELETION',
  LEGAL_HOLD = 'LEGAL_HOLD',
}

@Entity()
@Index(['emailHash'], { unique: true })
export class AccountBlacklist extends BaseEntity {
  @Column({ length: 64 })
  emailHash: string;

  @Column({ length: 120, nullable: true })
  originalEmail: string | null;

  @Column({
    type: 'enum',
    enum: AccountBlacklistReason,
    default: AccountBlacklistReason.USER_REQUESTED_DELETION,
  })
  reason: AccountBlacklistReason;

  @Column({ default: true })
  legalHold: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;
}
