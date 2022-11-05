import { Test, TestingModule } from '@nestjs/testing';
import { ResourceTypeService } from './resource-type.service';

describe('ResourceTypeService', () => {
  let service: ResourceTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResourceTypeService],
    }).compile();

    service = module.get<ResourceTypeService>(ResourceTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
