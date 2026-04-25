import { PermissionsController } from './permissions.controller';

describe('PermissionsController', () => {
  it('should be defined', () => {
    const controller = new PermissionsController({} as any);
    expect(controller).toBeDefined();
  });
});
