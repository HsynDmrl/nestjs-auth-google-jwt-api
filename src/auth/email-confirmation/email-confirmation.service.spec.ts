import { EmailConfirmationService } from './email-confirmation.service';

describe('EmailConfirmationService', () => {
  it('should be defined', () => {
    const service = new EmailConfirmationService({} as any);
    expect(service).toBeDefined();
  });
});
