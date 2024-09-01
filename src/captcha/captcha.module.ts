import { Module } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { CaptchaController } from './captcha.controller';

@Module({
  providers: [CaptchaService],
  exports: [CaptchaService],
  controllers: [CaptchaController],
})
export class CaptchaModule {}
