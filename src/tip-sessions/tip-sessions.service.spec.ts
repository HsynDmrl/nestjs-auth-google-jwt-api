import { TipSessionsService } from './tip-sessions.service';

describe('TipSessionsService', () => {
  it('should be defined', () => {
    const service = new TipSessionsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    expect(service).toBeDefined();
  });
});
