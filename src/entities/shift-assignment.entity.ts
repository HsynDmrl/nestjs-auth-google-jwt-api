import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ShiftTemplate } from './shift-template.entity';
import { WeeklySchedule } from './weekly-schedule.entity';

@Entity()
@Index(['weeklySchedule', 'user', 'dayOfWeek'], { unique: true })
export class ShiftAssignment extends BaseEntity {
  @ManyToOne(() => WeeklySchedule, (schedule) => schedule.assignments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  weeklySchedule: WeeklySchedule;

  @ManyToOne(() => ShiftTemplate, (template) => template.assignments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  shiftTemplate: ShiftTemplate;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'int' })
  dayOfWeek: number;
}
