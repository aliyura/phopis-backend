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
    private productCategory: Model<ResourceTypeDocument>,
  ) {}

  async createResourceType(requestDto: ResourceTypeDto): Promise<ApiResponse> {
    try {
      let title = requestDto.title.replace('\\s', '_');
      title = title.toUpperCase();
      requestDto.title = title;

      const response = await this.productCategory
        .findOne({ title: requestDto.title })
        .exec();

      if (response) return Helpers.fail('Resource type already exist');

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        rtuid: `rt${Helpers.getUniqueId()}`,
      } as ResourceType;

      const saved = await this.productCategory.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateResourceType(
    rtuid: string,
    requestDto: ResourceTypeDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.productCategory
        .findOne({ rtuid: rtuid })
        .exec();

      if (!response) return Helpers.fail('Resource type not found');

      const saved = await this.productCategory.updateOne(
        { rtuid: rtuid },
        { $set: requestDto },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteResourceType(rtuid: string): Promise<ApiResponse> {
    try {
      const response = await this.productCategory.deleteOne({ rtuid }).exec();
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async allResourceType(): Promise<ApiResponse> {
    try {
      const req = await this.productCategory.find().sort({ createdAt: -1 });
      if (req.length) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ResourceTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
