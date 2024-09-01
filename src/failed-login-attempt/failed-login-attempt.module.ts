import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FailedLoginAttemptService } from './failed-login-attempt.service';
import { FailedLoginAttempt } from 'src/entities/failed-login-attempt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FailedLoginAttempt])],
  providers: [FailedLoginAttemptService],
  exports: [FailedLoginAttemptService],
})
export class FailedLoginAttemptModule {}
