import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Status } from 'src/enums';
import { Helpers } from 'src/helpers';
import { ServiceTypeDto } from '../../dtos/service-type.dto';
import { Model } from 'mongoose';
import {
  ServiceType,
  ServiceTypeDocument,
} from '../../schemas/service-type.schema';
import { Messages } from 'src/utils/messages/messages';
import { User } from '../../schemas/user.schema';

@Injectable()
export class ServiceTypeService {
  constructor(
    @InjectModel(ServiceType.name)
    private serviceType: Model<ServiceTypeDocument>,
  ) {}

  async createServiceType(
    authenticatedUser: User,
    requestDto: ServiceTypeDto,
  ): Promise<ApiResponse> {
    try {
      let title = requestDto.title.replace('\\s', '_');
      title = title.toUpperCase();
      requestDto.title = title;

      const response = await this.serviceType
        .findOne({
          title: requestDto.title,
          businessId: authenticatedUser.businessId,
        })
        .exec();

      if (response) return Helpers.fail('Service type already exist');

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        businessId: authenticatedUser.businessId,
        stuid: `st${Helpers.getUniqueId()}`,
      } as ServiceType;

      const saved = await this.serviceType.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateServiceType(
    stuid: string,
    requestDto: ServiceTypeDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.serviceType.findOne({ stuid }).exec();

      if (!response) return Helpers.fail(Messages.ServiceTypeNotFound);

      const saved = await this.serviceType.updateOne(
        { stuid },
        { $set: requestDto },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteServiceType(stuid: string): Promise<ApiResponse> {
    try {
      const response = await this.serviceType.deleteOne({ stuid }).exec();
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async allServiceType(authenticatedUser: User): Promise<ApiResponse> {
    try {
      const req = await this.serviceType.find({
        businessId: authenticatedUser.businessId,
      });
      if (req.length) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ServiceTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
