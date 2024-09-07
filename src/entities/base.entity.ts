import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  @Expose()
  @Transform(({ value }) => moment(value).format('DD-MM-YYYY HH:mm:ss'), { toPlainOnly: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Expose()
  @Transform(({ value }) => moment(value).format('DD-MM-YYYY HH:mm:ss'), { toPlainOnly: true })
  updatedAt: Date;

  @DeleteDateColumn()
  @Expose()
  @Transform(({ value }) => value ? moment(value).format('DD-MM-YYYY HH:mm:ss') : null, { toPlainOnly: true })
  deletedAt?: Date;
  
  constructor() {
    this.id = uuidv4();
  }
}
