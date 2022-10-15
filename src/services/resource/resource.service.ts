import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import {
  ResourceDto,
  UpdateResourceDto,
  ResourceStatusUpdateDto,
} from '../../dtos/resource.dto';
import { ResourceDocument, Resource } from '../../schemas/resource.schema';
import { UserDocument, User } from 'src/schemas/user.schema';
import { AuthUserDto } from '../../dtos/user.dto';
import { Status } from 'src/enums';
import { ResourceOwnershipChangeDto } from '../../dtos/resource.dto';
import { Messages } from 'src/utils/messages/messages';
import {
  ResourceOwnershipLog,
  ResourceOwnershipLogDocument,
} from '../../schemas/resource-ownership-logs.schema';

@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource.name) private resource: Model<ResourceDocument>,
    @InjectModel(User.name) private user: Model<UserDocument>,
    @InjectModel(ResourceOwnershipLog.name)
    private resourceOwnershipLog: Model<ResourceOwnershipLogDocument>,
  ) {}
  async createResource(
    authUser: AuthUserDto,
    requestDto: ResourceDto,
  ): Promise<ApiResponse> {
    try {
      const resourceExistByIdentity = await this.resource.findOne({
        identityNumber: requestDto.identityNumber,
      });

      let resourceExistBySerialNumber;
      if (requestDto.cartonDetail && requestDto.cartonDetail.serialNumber) {
        resourceExistBySerialNumber = await this.resource.findOne({
          'cartonDetail.serialNumber': requestDto.cartonDetail.serialNumber,
        });
      }

      const authenticatedUser = await this.user.findOne({
        phoneNumber: authUser.username,
      });

      if (resourceExistByIdentity)
        return Helpers.fail('Resource identity you provide is already exist');

      if (resourceExistBySerialNumber)
        return Helpers.fail('Resource serial you provide is already exist');

      if (requestDto.carton) {
        if (!requestDto.cartonDetail || !requestDto.cartonDetail.serialNumber)
          return Helpers.fail('Serial number required');
        if (!requestDto.cartonDetail || !requestDto.cartonDetail.picture)
          return Helpers.fail('carton picture required');
      }

      const code = Helpers.getCode();
      const resourceId = `res${Helpers.getUniqueId()}`;

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        code: code,
        ruid: resourceId,
        currentOwnerUuid: authenticatedUser.uuid,
      } as any;

      const saved = await (await this.resource.create(request)).save();
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateResource(
    authUser: AuthUserDto,
    resourceId: string,
    requestDto: UpdateResourceDto,
  ): Promise<ApiResponse> {
    try {
      const authenticatedUser = await this.user
        .findOne({
          $or: [{ phoneNumber: authUser.username }, { nin: authUser.username }],
        })
        .exec();

      if (!authenticatedUser) return Helpers.fail('Resource owner not found');

      const existingResource = await this.resource.findOne({
        ruid: resourceId,
        uuid: authenticatedUser.uuid,
      });

      if (!existingResource) return Helpers.fail('Resource not found');

      const resourceOwner = await this.user.findOne({
        uuid: existingResource.currentOwnerUuid,
      });

      if (!resourceOwner) return Helpers.fail('Resource owner not found');

      if (resourceOwner.uuid != authenticatedUser.uuid) {
        return Helpers.fail('You do not permission to update this resource');
      }

      await this.resource.updateOne({ ruid: resourceId }, { $set: requestDto });
      return Helpers.success(
        await this.resource.findOne({
          ruid: resourceId,
        }),
      );
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteResource(
    authUser: AuthUserDto,
    resourceId: string,
  ): Promise<ApiResponse> {
    try {
      const authenticatedUser = await this.user
        .findOne({
          $or: [{ phoneNumber: authUser.username }, { nin: authUser.username }],
        })
        .exec();

      if (!authenticatedUser) return Helpers.fail('Resource owner not found');

      const existingResource = await this.resource.findOne({
        ruid: resourceId,
        uuid: authenticatedUser.uuid,
      });

      if (!existingResource) return Helpers.fail('Resource not found');

      const resourceOwner = await this.user.findOne({
        uuid: existingResource.currentOwnerUuid,
      });

      if (!resourceOwner) return Helpers.fail('Resource owner not found');

      if (resourceOwner.uuid != authenticatedUser.uuid)
        return Helpers.fail('You do not permission to update this resource');

      const response = await this.resource.deleteOne({
        ruid: resourceId,
        uuid: authenticatedUser.uuid,
      });
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateResourceStatus(
    authUser: AuthUserDto,
    resourceId: string,
    status: any,
    requestDto: ResourceStatusUpdateDto,
  ): Promise<ApiResponse> {
    try {
      const authenticatedUser = await this.user
        .findOne({
          $or: [{ phoneNumber: authUser.username }, { nin: authUser.username }],
        })
        .exec();

      if (!authenticatedUser) return Helpers.fail('Resource owner not found');

      const existingResource = await this.resource.findOne({
        ruid: resourceId,
      });
      if (!existingResource) return Helpers.fail('Resource not found');

      const resourceOwner = await this.user.findOne({
        uuid: existingResource.currentOwnerUuid,
      });
      if (!resourceOwner) return Helpers.fail('Resource owner not found');

      if (resourceOwner.uuid != authenticatedUser.uuid) {
        return Helpers.fail('You do not permission to update this resource');
      }

      if (!Object.values(Status).includes(status))
        return Helpers.fail('Invalid resource status');

      const dateTime = new Date();
      const request = {
        statusChangeDetail: {
          ...requestDto,
          date: dateTime.toISOString().slice(0, 10),
        },
        status: status,
      };

      const statusChangeHistory = {
        ...requestDto,
        status: status,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };

      await this.resource.updateOne(
        { ruid: resourceId },
        {
          $set: request,
          $push: {
            statusChangeHistory: statusChangeHistory,
          },
        },
        { upsert: true },
      );

      return Helpers.success(
        await this.resource.findOne({
          ruid: resourceId,
        }),
      );
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async changeResourceOwnership(
    authUser: AuthUserDto,
    resourceId: string,
    requestDto: ResourceOwnershipChangeDto,
  ): Promise<ApiResponse> {
    try {
      const authenticatedUser = await this.user
        .findOne({
          $or: [{ phoneNumber: authUser.username }, { nin: authUser.username }],
        })
        .exec();

      if (!authenticatedUser) return Helpers.fail('Resource owner not found');

      const existingResource = await this.resource.findOne({
        ruid: resourceId,
      });

      if (!existingResource) return Helpers.fail('Resource not found');

      let newOwner = await this.user.findOne({
        uuid: requestDto.newOwner,
      });

      if (!newOwner)
        newOwner = await this.user.findOne({
          code: requestDto.newOwner,
        });

      if (!newOwner)
        newOwner = await this.user.findOne({
          phoneNumber: requestDto.newOwner,
        });
      if (!newOwner) return Helpers.fail('New owner not found');

      if (authenticatedUser.uuid != existingResource.currentOwnerUuid)
        return Helpers.fail(
          'You do not have rights to change ownership of this resource',
        );

      const request = {
        prevOwnerUuid: authenticatedUser.uuid,
        currentOwnerUuid: newOwner.uuid,
        status: Status.ACTIVE,
        lastOwnershipChangeDate: new Date(),
      } as any;

      const ownershipHistory = {
        ...requestDto,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      } as any;

      await this.resource.updateOne(
        { ruid: resourceId },
        {
          $set: request,
          $push: {
            ownershipHistory: ownershipHistory,
          },
        },
        { upsert: true },
      );

      const dateTime = new Date();
      const resourceOwnership = {
        ...existingResource,
        ownerUuid: existingResource.currentOwnerUuid,
        releasedDate: dateTime.toISOString().slice(0, 10),
        newOwnerName: newOwner.name,
        newOwnerUuid: newOwner.uuid,
      } as any;

      delete resourceOwnership.prevOwnerUuid;
      delete resourceOwnership.currentOwnerUuid;

      resourceOwnership.status = Status.RELEASED;

      const saved = await (
        await this.resourceOwnershipLog.create(resourceOwnership)
      ).save();
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getMyResources(
    authUser: AuthUserDto,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const resourceOwner = await this.user.findOne({
        uuid: authUser.sub,
      });

      if (!resourceOwner) return Helpers.fail('Resource owner not found');

      const query = {
        currentOwnerUuid: resourceOwner.uuid,
      } as any;

      if (
        status &&
        Object.values(Status).includes(status.toUpperCase() as Status)
      ) {
        query.status = status.toUpperCase();
      }

      const resources = await this.resource.find(query);
      if (resources && resources.length > 0) return Helpers.success(resources);

      return Helpers.fail('No Resource found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchMyResources(
    authUser: AuthUserDto,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const resourceOwner = await this.user.findOne({
        uuid: authUser.sub,
      });

      if (!resourceOwner) return Helpers.fail('Resource owner not found');

      const resources = await this.resource.find({
        currentOwnerUuid: resourceOwner.uuid,
        $text: { $search: searchString },
      });
      if (resources && resources.length > 0) return Helpers.success(resources);

      return Helpers.fail('No Resource found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getResourceByRuid(
    authUser: AuthUserDto,
    ruid: string,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({ ruid });
      if (resource) return Helpers.success(resource);

      return Helpers.fail('Resource not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getResourceByIdentityNumber(
    authUser: AuthUserDto,
    identityNumber: string,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({ identityNumber });
      if (resource) return Helpers.success(resource);

      return Helpers.fail('Resource not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getResourceBySerialNumber(
    authUser: AuthUserDto,
    cattonSerialNumber: string,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({
        'cartonDetail.serialNumber': cattonSerialNumber,
      });
      if (resource) return Helpers.success(resource);

      return Helpers.fail('Resource not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getResourceByCode(
    authUser: AuthUserDto,
    code: string,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({ code });
      if (resource) return Helpers.success(resource);

      return Helpers.fail('Resource not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getResourceOwnershipLog(authUser: AuthUserDto): Promise<ApiResponse> {
    try {
      const authenticatedUser = await this.user
        .findOne({
          $or: [{ phoneNumber: authUser.username }, { nin: authUser.username }],
        })
        .exec();

      if (!authenticatedUser) return Helpers.fail('Resource owner not found');

      const resources = await this.resourceOwnershipLog.find({
        ownerUuid: authenticatedUser.uuid,
      });
      if (resources) return Helpers.success(resources);

      return Helpers.fail('No Resource found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
