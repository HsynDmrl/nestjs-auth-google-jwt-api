import { DistributionsController } from './distributions.controller';

describe('DistributionsController', () => {
  it('should be defined', () => {
    const controller = new DistributionsController({} as any);
    expect(controller).toBeDefined();
  });
});
