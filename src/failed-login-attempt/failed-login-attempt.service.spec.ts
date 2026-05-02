import { FailedLoginAttemptService } from './failed-login-attempt.service';

describe('FailedLoginAttemptService', () => {
  it('should be defined', () => {
    const service = new FailedLoginAttemptService({} as any, {} as any);
    expect(service).toBeDefined();
  });
});
