import { Test, TestingModule } from '@nestjs/testing';
import { ResourceTypeController } from './resource-type.controller';

describe('ResourceTypeController', () => {
  let controller: ResourceTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourceTypeController],
    }).compile();

    controller = module.get<ResourceTypeController>(ResourceTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
