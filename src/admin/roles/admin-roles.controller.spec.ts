import { AdminRolesController } from './admin-roles.controller';

describe('AdminRolesController', () => {
  it('should be defined', () => {
    const controller = new AdminRolesController({} as any);
    expect(controller).toBeDefined();
  });
});
