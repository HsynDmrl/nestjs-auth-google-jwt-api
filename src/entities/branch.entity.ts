import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { Team } from './team.entity';
import { Membership } from './membership.entity';
import { TipSession } from './tip-session.entity';

@Entity()
@Index(['company', 'name'], { unique: true })
export class Branch extends BaseEntity {
  @Column({ length: 150 })
  name: string;

  @ManyToOne(() => Company, (company) => company.branches, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  company: Company;

  @OneToMany(() => Team, (team) => team.branch)
  teams: Team[];

  @OneToMany(() => Membership, (membership) => membership.branch)
  memberships: Membership[];

  @OneToMany(() => TipSession, (tipSession) => tipSession.branch)
  tipSessions: TipSession[];
}
