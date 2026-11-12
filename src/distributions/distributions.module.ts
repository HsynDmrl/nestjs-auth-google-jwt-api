import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Distribution } from 'src/entities/distribution.entity';
import { TipSession } from 'src/entities/tip-session.entity';
import { DistributionsController } from './distributions.controller';
import { DistributionsService } from './distributions.service';

@Module({
  imports: [TypeOrmModule.forFeature([TipSession, Distribution])],
  controllers: [DistributionsController],
  providers: [DistributionsService],
  exports: [DistributionsService, TypeOrmModule],
})
export class DistributionsModule {}
