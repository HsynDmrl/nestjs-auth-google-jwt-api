import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

describe('EmailService', () => {
  it('should be defined', () => {
    const service = new EmailService();
    expect(service).toBeDefined();
  });
});
