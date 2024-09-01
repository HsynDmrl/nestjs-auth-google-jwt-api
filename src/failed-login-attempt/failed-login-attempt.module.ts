import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FailedLoginAttemptService } from './failed-login-attempt.service';
import { FailedLoginAttempt } from 'src/entities/failed-login-attempt.entity';
import { CaptchaModule } from 'src/captcha/captcha.module';

@Module({
  imports: [TypeOrmModule.forFeature([FailedLoginAttempt]),
  CaptchaModule,],
  providers: [FailedLoginAttemptService],
  exports: [FailedLoginAttemptService],
})
export class FailedLoginAttemptModule {}
