import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  it('should be defined', () => {
    const service = new CaptchaService();
    expect(service).toBeDefined();
  });
});
