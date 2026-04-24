import { Test, TestingModule } from '@nestjs/testing';
import { AdminRolesController } from './admin-roles.controller';

describe('AdminRolesController', () => {
  let controller: AdminRolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRolesController],
    }).compile();

    controller = module.get<AdminRolesController>(AdminRolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
