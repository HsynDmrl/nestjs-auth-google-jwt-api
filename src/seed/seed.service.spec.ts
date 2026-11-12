import { SeedService } from './seed.service';

describe('SeedService', () => {
  it('should be defined', () => {
    const service = new SeedService({} as any, {} as any, {} as any);
    expect(service).toBeDefined();
  });
});
