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
import { Messages } from 'src/utils/messages/messages';

@Injectable()
export class ResourceTypeService {
  constructor(
    @InjectModel(ResourceType.name)
    private resourceType: Model<ResourceTypeDocument>,
  ) {}

  async createResourceType(requestDto: ResourceTypeDto): Promise<ApiResponse> {
    try {
      const response = await this.resourceType
        .findOne({ title: requestDto.title })
        .exec();

      if (response) return Helpers.fail('Resource type already exist');

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        resourceTypeId: `RTI${Helpers.getUniqueId()}`,
      } as ResourceType;

      const saved = await this.resourceType.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findResourceType(type: string): Promise<ApiResponse> {
    try {
      const req = await this.resourceType.findOne({ resourceTypeId: type });
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ResourceTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async allResourceType(): Promise<ApiResponse> {
    try {
      const req = await this.resourceType.find();
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ResourceTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
