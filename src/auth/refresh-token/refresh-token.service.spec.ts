import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  it('should be defined', () => {
    const service = new RefreshTokenService({} as any);
    expect(service).toBeDefined();
  });
});
