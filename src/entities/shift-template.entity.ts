import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { ShiftAssignment } from './shift-assignment.entity';

@Entity()
export class ShiftTemplate extends BaseEntity {
  @ManyToOne(() => Branch, { nullable: false, onDelete: 'CASCADE' })
  branch: Branch;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @OneToMany(() => ShiftAssignment, (assignment) => assignment.shiftTemplate)
  assignments: ShiftAssignment[];
}
