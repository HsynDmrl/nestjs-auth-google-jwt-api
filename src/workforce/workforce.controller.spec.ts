import { WorkforceController } from './workforce.controller';

describe('WorkforceController', () => {
  it('should be defined', () => {
    const controller = new WorkforceController({} as any);
    expect(controller).toBeDefined();
  });
});
