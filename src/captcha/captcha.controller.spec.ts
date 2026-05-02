import { CaptchaController } from './captcha.controller';

describe('CaptchaController', () => {
  it('should be defined', () => {
    const controller = new CaptchaController({} as any);
    expect(controller).toBeDefined();
  });
});
