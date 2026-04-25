import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  it('should be defined', () => {
    const service = new PermissionsService({} as any, {} as any, {} as any);
    expect(service).toBeDefined();
  });
});
