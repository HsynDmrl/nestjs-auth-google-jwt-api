import { GoogleAuthController } from './google-auth.controller';

describe('GoogleAuthController', () => {
  it('should be defined', () => {
    const controller = new GoogleAuthController({} as any);
    expect(controller).toBeDefined();
  });
});
