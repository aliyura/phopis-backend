import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Status } from 'src/enums';
import { Helpers } from 'src/helpers';
import { ResourceTypeDto } from '../../dtos/resource-type.dto';
import { Model } from 'mongoose';
import {
  ResourceType,
  ResourceTypeDocument,
} from '../../schemas/resource-type.schema';

@Injectable()
export class ResourceTypeService {
  constructor(
    @InjectModel(ResourceType.name)
    private resourceType: Model<ResourceTypeDocument>,
  ) {}

  async createResourceType(requestDto: ResourceTypeDto): Promise<ApiResponse> {
    const response = await this.resourceType
      .findOne({ title: requestDto.title })
      .exec();

    if (response)
      return Helpers.error('Resource type already exist', 'BAD_REQUEST');

    const request = {
      ...requestDto,
      status: Status.ACTIVE,
      resourceTypeId: `RTI${Helpers.getUniqueId()}`,
    } as ResourceType;

    const saved = await this.resourceType.create(request);
    return Helpers.success(saved, 'Created Successfully');
  }

  async findResourceType(type: string): Promise<ApiResponse> {
    const req = await this.resourceType.findOne({ resourceTypeId: type });
    if (req) {
      return Helpers.success(req, 'Request SUccessful');
    }
    return Helpers.error('Resource type not found', 'NOT_FOUND');
  }

  async allResourceType(): Promise<ApiResponse> {
    const req = await this.resourceType.find();
    if (req) {
      return Helpers.success(req, 'Request SUccessful');
    }
    return Helpers.error('Resource types not found', 'NOT_FOUND');
  }
}
