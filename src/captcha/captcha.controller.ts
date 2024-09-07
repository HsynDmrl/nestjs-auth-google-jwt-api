import { Controller, Get, Post, Body, Session, HttpStatus, HttpException } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Captcha Oluştur', description: 'Yeni bir Captcha oluşturur ve SVG görüntüsünü döner.' })
  @ApiResponse({ status: 200, description: 'Captcha başarıyla oluşturuldu.', schema: { type: 'string', description: 'Captcha SVG' } })
  generateCaptcha(@Session() session: Record<string, any>) {
    const captcha = this.captchaService.generateCaptcha();
    session.captcha = captcha.text; // Captcha metnini oturumda sakla
    return captcha.image; // SVG captcha resmi
  }

  @Post('verify')
  @ApiOperation({ summary: 'Captcha Doğrula', description: 'Kullanıcının girdiği Captcha\'yı doğrular.' })
  @ApiBody({ schema: { type: 'object', properties: { captchaInput: { type: 'string', example: 'abcd' } } } })
  @ApiResponse({ status: 200, description: 'Captcha doğrulaması başarılı.' })
  @ApiResponse({ status: 400, description: 'Captcha doğrulaması başarısız oldu.' })
  verifyCaptcha(@Body('captchaInput') captchaInput: string, @Session() session: Record<string, any>) {
    const isValid = this.captchaService.verifyCaptcha(captchaInput, session.captcha);
    if (!isValid) {
      throw new HttpException('Captcha doğrulaması başarısız oldu.', HttpStatus.BAD_REQUEST);
    }
    return { message: 'Captcha doğrulaması başarılı!' };
  }
}
