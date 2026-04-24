import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Branch } from './branch.entity';
import { Team } from './team.entity';

export enum MembershipRole {
  OWNER = 'OWNER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  STAFF = 'STAFF',
}

@Entity()
@Index(['user', 'branch'], { unique: true })
export class Membership extends BaseEntity {
  @ManyToOne(() => User, (user) => user.memberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  company: Company;

  @ManyToOne(() => Branch, (branch) => branch.memberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  branch: Branch;

  @ManyToOne(() => Team, (team) => team.memberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  team: Team;

  @Column({
    type: 'enum',
    enum: MembershipRole,
    default: MembershipRole.STAFF,
  })
  role: MembershipRole;

  @Column({ default: true })
  isActive: boolean;
}
