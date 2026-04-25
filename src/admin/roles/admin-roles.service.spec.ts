import { AdminRolesService } from './admin-roles.service';

describe('AdminRolesService', () => {
  it('should be defined', () => {
    const service = new AdminRolesService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    expect(service).toBeDefined();
  });
});
