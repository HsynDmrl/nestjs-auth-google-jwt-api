import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Membership } from './membership.entity';
import { TipSession } from './tip-session.entity';

@Entity()
@Index(['branch', 'name'], { unique: true })
export class Team extends BaseEntity {
  @Column({ length: 150 })
  name: string;

  @ManyToOne(() => Branch, (branch) => branch.teams, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  branch: Branch;

  @OneToMany(() => Membership, (membership) => membership.team)
  memberships: Membership[];

  @OneToMany(() => TipSession, (tipSession) => tipSession.team)
  tipSessions: TipSession[];
}
