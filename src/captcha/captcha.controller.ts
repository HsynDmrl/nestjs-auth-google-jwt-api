import { Controller, Get, Post, Body, Session, HttpStatus, HttpException } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('generate')
  generateCaptcha(@Session() session: Record<string, any>) {
    const captcha = this.captchaService.generateCaptcha();
    session.captcha = captcha.text; // Captcha metnini oturumda sakla
    return captcha.image; // SVG captcha resmi
  }

  @Post('verify')
  verifyCaptcha(@Body('captchaInput') captchaInput: string, @Session() session: Record<string, any>) {
    const isValid = this.captchaService.verifyCaptcha(captchaInput, session.captcha);
    if (!isValid) {
      throw new HttpException('Captcha doğrulaması başarısız oldu.', HttpStatus.BAD_REQUEST);
    }
    return { message: 'Captcha doğrulaması başarılı!' };
  }
}
