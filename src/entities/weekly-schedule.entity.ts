import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { ShiftAssignment } from './shift-assignment.entity';

@Entity()
export class WeeklySchedule extends BaseEntity {
  @ManyToOne(() => Branch, { nullable: false, onDelete: 'CASCADE' })
  branch: Branch;

  @Column({ type: 'date' })
  weekStartDate: string;

  @Column({ type: 'date' })
  weekEndDate: string;

  @OneToMany(() => ShiftAssignment, (assignment) => assignment.weeklySchedule)
  assignments: ShiftAssignment[];
}
