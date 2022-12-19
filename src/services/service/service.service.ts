import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { ServiceDocument, Service } from '../../schemas/service.schema';
import { UserDocument, User } from 'src/schemas/user.schema';
import { Status } from 'src/enums';
import { Messages } from 'src/utils/messages/messages';
import { ActionType, AccountType, UserRole } from '../../enums/enums';
import {
  ServiceTypeDocument,
  ServiceType,
} from '../../schemas/service-type.schema';
import { ServiceDto, UpdateServiceDto } from '../../dtos/service.dto';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name) private service: Model<ServiceDocument>,
    @InjectModel(User.name) private user: Model<UserDocument>,
    @InjectModel(ServiceType.name)
    private serviceType: Model<ServiceTypeDocument>,
  ) {}
  async createService(
    authenticatedUser: User,
    requestDto: ServiceDto,
  ): Promise<ApiResponse> {
    try {
      if (authenticatedUser.accountType != AccountType.BUSINESS)
        return Helpers.fail(Messages.NoPermission);

      const serviceExistByTitle = await this.service.findOne({
        title: requestDto.title,
        businessId: authenticatedUser.businessId,
      });
      if (serviceExistByTitle) return Helpers.fail('Service already exist');

      const typeExist = await this.serviceType.findOne({
        title: requestDto.type,
        businessId: authenticatedUser.businessId,
      });
      if (!typeExist) return Helpers.fail('Service type not exist');

      if (!requestDto.charges || requestDto.charges <= 0)
        return Helpers.fail('Service charges required');

      const code = Helpers.getCode();
      const serviceId = `ser${Helpers.getUniqueId()}`;
      const businessId = authenticatedUser.businessId || authenticatedUser.uuid;
      const status = Status.AVAILABLE;

      const request = {
        ...requestDto,
        status: status,
        code: code,
        suid: serviceId,
        businessId: businessId,
        createdBy: authenticatedUser.name,
        createdById: authenticatedUser.uuid,
      } as Service;
      const saved = await (await this.service.create(request)).save();
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateService(
    authenticatedUser: User,
    suid: string,
    requestDto: UpdateServiceDto,
  ): Promise<ApiResponse> {
    try {
      const existingService = await this.service.findOne({
        suid,
      });

      if (!existingService) return Helpers.fail('Service not found');

      const request = {
        ...requestDto,
      };

      const updateHistory = {
        ...requestDto,
        actionType: ActionType.UPDATE,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };

      const updated = await this.service.updateOne(
        { suid },
        {
          $set: request,
          $push: {
            updateHistory: updateHistory,
          },
        },
        { upsert: true },
      );

      return Helpers.success(updated);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteService(
    authenticatedUser: User,
    suid: string,
  ): Promise<ApiResponse> {
    try {
      const response = await this.service.deleteOne({
        suid,
        businessId: authenticatedUser.businessId,
      });
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getMyServices(
    page: number,
    authenticatedUser: User,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const query = {} as any;
      query.businessId = authenticatedUser.businessId || authenticatedUser.uuid;

      if (
        status &&
        Object.values(Status).includes(status.toUpperCase() as Status)
      ) {
        query.status = status.toUpperCase();
      }

      const size = 20;
      const skip = page || 0;

      const count = await this.service.count(query);
      const result = await this.service
        .find(query)
        .skip(skip * size)
        .limit(size)
        .sort({ createdAt: -1 });

      if (result.length) {
        const totalPages = Math.round(count / size);
        return Helpers.success({
          page: result,
          size: size,
          currentPage: Number(skip),
          totalPages:
            totalPages > 0
              ? totalPages
              : count > 0 && result.length > 0
              ? 1
              : 0,
        });
      }

      return Helpers.fail('No Service found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchMyServices(
    page: number,
    authenticatedUser: User,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const query = {
        $text: { $search: searchString },
      } as any;
      query.businessId = authenticatedUser.businessId || authenticatedUser.uuid;

      const size = 20;
      const skip = page || 0;

      const count = await this.service.count(query);
      const result = await this.service
        .find(query)
        .skip(skip * size)
        .limit(size)
        .sort({ createdAt: -1 });

      if (result.length) {
        const totalPages = Math.round(count / size);
        return Helpers.success({
          page: result,
          size: size,
          currentPage: Number(skip),
          totalPages:
            totalPages > 0
              ? totalPages
              : count > 0 && result.length > 0
              ? 1
              : 0,
        });
      }

      return Helpers.fail('No Service found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
