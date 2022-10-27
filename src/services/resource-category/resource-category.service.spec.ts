import { Test, TestingModule } from '@nestjs/testing';
import { ResourceCategoryService } from './resource-category.service';

describe('ResourceCategoryService', () => {
  let service: ResourceCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResourceCategoryService],
    }).compile();

    service = module.get<ResourceCategoryService>(ResourceCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
