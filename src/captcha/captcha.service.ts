import { Injectable } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';

@Injectable()
export class CaptchaService {
  generateCaptcha() {
    const captcha = svgCaptcha.create({
      size: 6, // Captcha karakter uzunluğu
      noise: 3, // Gürültü seviyesi
      color: true,
      background: '#cc9966'
    });

    return {
      text: captcha.text,
      image: captcha.data
    };
  }

  verifyCaptcha(userInput: string, captchaText: string): boolean {
    return userInput === captchaText;
  }
}
