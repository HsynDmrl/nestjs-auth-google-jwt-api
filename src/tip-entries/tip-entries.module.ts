import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipEntry } from 'src/entities/tip-entry.entity';
import { TipSession } from 'src/entities/tip-session.entity';
import { TipEntriesController } from './tip-entries.controller';
import { TipEntriesService } from './tip-entries.service';

@Module({
  imports: [TypeOrmModule.forFeature([TipEntry, TipSession])],
  controllers: [TipEntriesController],
  providers: [TipEntriesService],
  exports: [TipEntriesService, TypeOrmModule],
})
export class TipEntriesModule {}
