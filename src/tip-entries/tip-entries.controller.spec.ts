import { TipEntriesController } from './tip-entries.controller';

describe('TipEntriesController', () => {
  it('should be defined', () => {
    const controller = new TipEntriesController({} as any);
    expect(controller).toBeDefined();
  });
});
