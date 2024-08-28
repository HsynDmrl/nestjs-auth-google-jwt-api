import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Permission } from './permission.entity';

@Entity()
export class Role extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => User, user => user.roles)
  users: User[];

  @ManyToMany(() => Permission, permission => permission.roles)
  @JoinTable()
  permissions: Permission[];

}
