import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  it('should be defined', () => {
    const service = new PasswordResetService({} as any);
    expect(service).toBeDefined();
  });
});
