import { TenancyController } from './tenancy.controller';

describe('TenancyController', () => {
  it('should be defined', () => {
    const controller = new TenancyController({} as any, {} as any);
    expect(controller).toBeDefined();
  });
});
