import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name: string;
}