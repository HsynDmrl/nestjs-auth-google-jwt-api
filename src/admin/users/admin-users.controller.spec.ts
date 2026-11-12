import { AdminUsersController } from './admin-users.controller';

describe('AdminUsersController', () => {
  it('should be defined', () => {
    const controller = new AdminUsersController({} as any);
    expect(controller).toBeDefined();
  });
});
