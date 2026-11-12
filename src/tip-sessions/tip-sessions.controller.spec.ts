import { TipSessionsController } from './tip-sessions.controller';

describe('TipSessionsController', () => {
  it('should be defined', () => {
    const controller = new TipSessionsController({} as any);
    expect(controller).toBeDefined();
  });
});
