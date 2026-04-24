import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipSession } from 'src/entities/tip-session.entity';
import { User } from 'src/entities/user.entity';
import { TipSessionsController } from './tip-sessions.controller';
import { TipSessionsService } from './tip-sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([TipSession, User])],
  controllers: [TipSessionsController],
  providers: [TipSessionsService],
  exports: [TipSessionsService, TypeOrmModule],
})
export class TipSessionsModule {}
