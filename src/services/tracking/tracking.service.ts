import { Injectable } from '@nestjs/common';
import {
  TrackingRequestDto,
  TrackingStatusChangeDto,
} from '../../dtos/tracking.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { Status } from 'src/enums';
import { Messages } from 'src/utils/messages/messages';
import { TrackingDocument, Tracking } from '../../schemas/tracking.schema';
import { ResourceDocument, Resource } from '../../schemas/resource.schema';
import { ActionType, UserRole } from '../../enums/enums';
import { User } from '../../schemas/user.schema';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(Resource.name) private resource: Model<ResourceDocument>,
    @InjectModel(Tracking.name) private tracking: Model<TrackingDocument>,
  ) {}
  async createTrackingRequest(
    authenticatedUser: User,
    requestDto: TrackingRequestDto,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({
        ruid: requestDto.resourceId,
      });
      if (!resource) return Helpers.fail('Resource not found');

      const code = Helpers.getCode();
      const truid = `tr${Helpers.getUniqueId()}`;

      console.log(resource);

      const request = {
        ...requestDto,
        resourceName: resource.name,
        resourceIdentityNumber: resource.identityNumber,
        resourceType: resource.type,
        code,
        truid,
        status: Status.PENDING,
        uuid: authenticatedUser.uuid,
        requestedBy: authenticatedUser.name,
      } as any;

      const saved = await (await this.tracking.create(request)).save();
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateTrackingRequest(
    authenticatedUser: User,
    trackingId: string,
    requestDto: TrackingStatusChangeDto,
  ): Promise<ApiResponse> {
    try {
      const tracking = await this.tracking.findOne({
        truid: trackingId,
      });
      if (!tracking) return Helpers.fail('Tracking request not found');

      if (
        !requestDto.status ||
        !Object.values(Status).includes(
          requestDto.status.toUpperCase() as Status,
        )
      ) {
        return Helpers.fail('Invalid status');
      }

      requestDto.status = requestDto.status.toUpperCase();

      if (requestDto.status === Status.INPROGRESS) {
        if (authenticatedUser.role !== UserRole.ADMIN) {
          return Helpers.fail(Messages.NoPermission);
        }
      }
      const statusChangeHistory = {
        ...requestDto,
        actionType: ActionType.UPDATE,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };

      const updated = await this.tracking.updateOne(
        { truid: trackingId },
        {
          $set: { status: requestDto.status },
          $push: {
            statusChangeHistory: statusChangeHistory,
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

  async getMyTrackingRequests(
    page: number,
    authenticatedUser: User,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const query = {
        uuid: authenticatedUser.uuid,
      } as any;

      if (
        status &&
        Object.values(Status).includes(status.toUpperCase() as Status)
      ) {
        query.status = status.toUpperCase();
      }

      const size = 20;
      const skip = page || 0;

      const count = await this.tracking.count(query);
      const result = await this.tracking
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

      return Helpers.fail('No tracking request found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchMyTrackingRequest(
    page: number,
    authenticatedUser: User,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const query = {
        uuid: authenticatedUser.uuid,
        $text: { $search: searchString },
      };
      const size = 20;
      const skip = page || 0;

      const count = await this.tracking.count(query);
      const result = await this.tracking
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

      return Helpers.fail('No tracking request found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
