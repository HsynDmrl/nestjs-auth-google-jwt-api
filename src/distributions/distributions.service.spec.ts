import { DistributionsService } from './distributions.service';

describe('DistributionsService', () => {
  it('should be defined', () => {
    const service = new DistributionsService({} as any, {} as any);
    expect(service).toBeDefined();
  });
});
