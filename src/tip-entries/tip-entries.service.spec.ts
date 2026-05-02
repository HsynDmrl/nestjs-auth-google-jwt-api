import { TipEntriesService } from './tip-entries.service';

describe('TipEntriesService', () => {
  it('should be defined', () => {
    const service = new TipEntriesService({} as any, {} as any);
    expect(service).toBeDefined();
  });
});
