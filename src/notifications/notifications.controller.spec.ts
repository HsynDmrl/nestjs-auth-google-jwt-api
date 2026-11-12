import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  it('should be defined', () => {
    const controller = new NotificationsController({} as any);
    expect(controller).toBeDefined();
  });
});
