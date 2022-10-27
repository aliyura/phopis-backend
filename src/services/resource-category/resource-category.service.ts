import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Status } from 'src/enums';
import { Helpers } from 'src/helpers';
import { ResourceCategoryDto } from '../../dtos/resource-category.dto';
import { Model } from 'mongoose';
import {
  ResourceCategory,
  ResourceCategoryDocument,
} from '../../schemas/resource-category.schema';
import { Messages } from 'src/utils/messages/messages';

@Injectable()
export class ResourceCategoryService {
  constructor(
    @InjectModel(ResourceCategory.name)
    private resourceType: Model<ResourceCategoryDocument>,
  ) {}

  async createResourceCategory(
    requestDto: ResourceCategoryDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.resourceType
        .findOne({ title: requestDto.title })
        .exec();

      if (response) return Helpers.fail('Resource category already exist');

      let title = requestDto.title.replace('\\s', '_');
      title = title.toUpperCase();
      requestDto.title = title;

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        rcuid: `rc${Helpers.getUniqueId()}`,
      } as ResourceCategory;

      const saved = await this.resourceType.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateResourceCategory(
    id: string,
    requestDto: ResourceCategoryDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.resourceType
        .findOne({ resourceTypeId: id })
        .exec();

      if (!response) return Helpers.fail('Resource type not found');

      const saved = await this.resourceType.updateOne(
        { resourceTypeId: id },
        { $set: requestDto },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteResourceCategory(rcuid: string): Promise<ApiResponse> {
    try {
      const response = await this.resourceType.deleteOne({ rcuid }).exec();
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findResourceCategory(rcuid: string): Promise<ApiResponse> {
    try {
      const req = await this.resourceType.findOne({ rcuid });
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ResourceCategoryNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async allResourceCategory(): Promise<ApiResponse> {
    try {
      const req = await this.resourceType.find();
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ResourceCategoryNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
