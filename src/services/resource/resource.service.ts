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

@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource.name) private resource: Model<ResourceDocument>,
    @InjectModel(User.name) private user: Model<UserDocument>,
  ) {}
  async createResource(
    authUser: AuthUserDto,
    requestDto: ResourceDto,
  ): Promise<ApiResponse> {
    try {
      const resourceExistByIdentity = await this.resource.findOne({
        identityNumber: requestDto.identityNumber,
      });
      const resourceExistBySerialNumber = await this.resource.findOne({
        cattonSerialNumber: requestDto.cattonDetail.serialNumber,
      });

      console.log('resourceByExistByIdentity', resourceExistByIdentity);
      console.log('resourceByExistBySerialNumber', resourceExistBySerialNumber);

      const authenticatedUser = await this.user.findOne({
        phoneNumber: authUser.username,
      });

      if (resourceExistByIdentity)
        return Helpers.no('Resource identity you provide is already exist');

      if (resourceExistBySerialNumber)
        return Helpers.no('Resource serial you provide is already exist');

      if (requestDto.catton) {
        if (!requestDto.cattonDetail || !requestDto.cattonDetail.serialNumber)
          return Helpers.no('Serial number required');
        if (!requestDto.cattonDetail || !requestDto.cattonDetail.picture)
          return Helpers.no('Catton picture required');
      }

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        code: `R${Helpers.getCode()}`,
        ruid: `res${Helpers.getUniqueId()}`,
        currentOwnerUuid: authenticatedUser.uuid,
      } as any;

      const saved = await (await this.resource.create(request)).save();
      return Helpers.yes(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async updateResource(
    authUser: AuthUserDto,
    resourceId: string,
    requestDto: UpdateResourceDto,
  ): Promise<ApiResponse> {
    try {
      const existingResource = await this.resource.findOne({
        ruid: resourceId,
      });

      if (!existingResource) return Helpers.no('Resource not found');

      const resourceOwner = await this.user.findOne({
        currentOwnerUuid: existingResource.currentOwnerUuid,
      });

      if (!resourceOwner) return Helpers.no('Resource owner not found');

      const authenticatedUser = await this.user.findOne({
        phoneNumber: authUser.username,
      });

      if (resourceOwner.uuid != authenticatedUser.uuid) {
        return Helpers.no('You do not permission to update this resource');
      }

      await this.resource.updateOne({ ruid: resourceId }, { $set: requestDto });
      return Helpers.yes(
        await this.resource.findOne({
          ruid: resourceId,
        }),
      );
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async updateResourceStatus(
    authUser: AuthUserDto,
    resourceId: string,
    status: any,
    requestDto: ResourceStatusUpdateDto,
  ): Promise<ApiResponse> {
    try {
      const existingResource = await this.resource.findOne({
        ruid: resourceId,
      });

      if (!existingResource) return Helpers.no('Resource not found');

      const resourceOwner = await this.user.findOne({
        currentOwnerUuid: existingResource.currentOwnerUuid,
      });

      if (!resourceOwner) return Helpers.no('Resource owner not found');

      const authenticatedUser = await this.user.findOne({
        phoneNumber: authUser.username,
      });

      if (resourceOwner.uuid != authenticatedUser.uuid) {
        return Helpers.no('You do not permission to update this resource');
      }

      if (!Object.values(Status).includes(status))
        return Helpers.no('Invalid status');

      if (status == Status.MISSING) {
        if (!requestDto.date) return Helpers.no('Missing date required');
      }

      const request = { missingDetail: requestDto, status: status };

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

      return Helpers.yes(
        await this.resource.findOne({
          ruid: resourceId,
        }),
      );
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async changeResourceOwnership(
    authUser: AuthUserDto,
    resourceId: string,
    requestDto: ResourceOwnershipChangeDto,
  ): Promise<ApiResponse> {
    try {
      const existingResource = await this.resource.findOne({
        ruid: resourceId,
      });

      if (!existingResource) return Helpers.no('Resource not found');

      let resourceOwner = await this.user.findOne({
        uuid: requestDto.currentOwner,
      });

      if (!resourceOwner)
        resourceOwner = await this.user.findOne({
          code: requestDto.currentOwner,
        });

      if (!resourceOwner)
        resourceOwner = await this.user.findOne({
          phoneNumber: requestDto.currentOwner,
        });

      console.log('resourceOwner', resourceOwner);
      console.log('existingResource', existingResource);

      if (!resourceOwner) return Helpers.no('Resource owner not found');

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

      console.log('newOwner', newOwner);

      if (!newOwner) return Helpers.no('New owner not found');

      const authenticatedUser = await this.user.findOne({
        phoneNumber: authUser.username,
      });

      console.log('authUser', authenticatedUser.uuid);
      console.log('resourceUser', existingResource.currentOwnerUuid);

      if (authenticatedUser.uuid != existingResource.currentOwnerUuid)
        return Helpers.no(
          'You do not have rights to change ownership of this resource',
        );

      if (existingResource.status == Status.MISSING)
        return Helpers.no("You can't change ownership of a missing resource ");

      const request = {
        prevOwnerUuid: resourceOwner.uuid,
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

      return Helpers.yes(
        await this.resource.findOne({
          ruid: resourceId,
        }),
      );
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async getMyResources(authUser: AuthUserDto): Promise<ApiResponse> {
    try {
      const resourceOwner = await this.user.findOne({
        uuid: authUser.sub,
      });

      if (!resourceOwner) return Helpers.no('Resource owner not found');

      const resources = await this.resource.find({
        currentOwnerUuid: resourceOwner.uuid,
      });
      if (resources && resources.length > 0) return Helpers.yes(resources);

      return Helpers.no('No Resource found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async getResourceByRuid(
    authUser: AuthUserDto,
    ruid: string,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({ ruid });
      if (resource) return Helpers.yes(resource);

      return Helpers.no('Resource not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async getResourceByIdentityNumber(
    authUser: AuthUserDto,
    identityNumber: string,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({ identityNumber });
      if (resource) return Helpers.yes(resource);

      return Helpers.no('Resource not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async getResourceBySerialNumber(
    authUser: AuthUserDto,
    cattonSerialNumber: string,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({
        'cattonDetail.serialNumber': cattonSerialNumber,
      });
      if (resource) return Helpers.yes(resource);

      return Helpers.no('Resource not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async getResourceByCode(
    authUser: AuthUserDto,
    code: string,
  ): Promise<ApiResponse> {
    try {
      const resource = await this.resource.findOne({ code });
      if (resource) return Helpers.yes(resource);

      return Helpers.no('Resource not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }
}
