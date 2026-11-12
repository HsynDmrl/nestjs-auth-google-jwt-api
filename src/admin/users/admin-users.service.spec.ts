import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  it('should be defined', () => {
    const service = new AdminUsersService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    expect(service).toBeDefined();
  });
});
