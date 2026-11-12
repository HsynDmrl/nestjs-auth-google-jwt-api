import { AdminDashboardController } from './admin-dashboard.controller';

describe('AdminDashboardController', () => {
  it('should be defined', () => {
    const controller = new AdminDashboardController({} as any);
    expect(controller).toBeDefined();
  });
});
