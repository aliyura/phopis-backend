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
    const resourceByExistByIdentity = await this.resource.findOne({
      identityNumber: requestDto.identityNumber,
    });
    const resourceByExistBySerialNumber = await this.resource.findOne({
      cattonSerialNumber: requestDto.cattonSerialNumber,
    });

    let resourceOwner = null;
    if (resourceByExistByIdentity || resourceByExistBySerialNumber) {
      const ownerId = resourceByExistByIdentity
        ? resourceByExistByIdentity.currentOwnerUuid
        : resourceByExistBySerialNumber.currentOwnerUuid;
      resourceOwner = this.user.findOne({ currentOwnerUuid: ownerId });
    }

    const authenticatedUser = await this.user.findOne({
      phoneNumber: authUser.username,
    });

    if (resourceOwner.uuid === authenticatedUser.uuid) {
      return Helpers.error('Resource already exist', 'BAD_REQUEST');
    }

    if (resourceByExistByIdentity)
      return Helpers.error(
        'Resource identity you provide is owned by user (' + resourceOwner
          ? resourceOwner.name
          : 'Unknown User' + ')',
        'BAD_REQUEST',
      );

    if (resourceByExistBySerialNumber)
      return Helpers.error(
        'Resource serial you provide is owned by user (' + resourceOwner
          ? resourceOwner.name
          : 'Unknown User' + ')',
        'BAD_REQUEST',
      );

    if (requestDto.catton) {
      if (!requestDto.cattonSerialNumber)
        return Helpers.error('Resource serial number required', 'BAD_REQUEST');
      if (!requestDto.cattonPicture)
        return Helpers.error('Resource catton picture required', 'BAD_REQUEST');
    }

    const request = {
      ...requestDto,
      status: Status.ACTIVE,
      code: `R${Helpers.getCode()}`,
      ruid: `res${Helpers.getUniqueId()}`,
      currentOwnerUuid: authenticatedUser.uuid,
    } as any;

    const saved = await (await this.resource.create(request)).save();
    return Helpers.success(saved, 'Resource Created Successfully');
  }

  async updateResource(
    authUser: AuthUserDto,
    resourceId: string,
    requestDto: UpdateResourceDto,
  ): Promise<ApiResponse> {
    const existingResource = await this.resource.findOne({
      ruid: resourceId,
    });

    if (!existingResource)
      return Helpers.error('Resource not found', 'BAD_REQUEST');

    const resourceOwner = await this.user.findOne({
      currentOwnerUuid: existingResource.currentOwnerUuid,
    });

    if (!resourceOwner)
      return Helpers.error('Resource owner not found', 'BAD_REQUEST');

    const authenticatedUser = await this.user.findOne({
      phoneNumber: authUser.username,
    });

    if (resourceOwner.uuid != authenticatedUser.uuid) {
      return Helpers.error(
        'You do not permission to update this resource',
        'BAD_REQUEST',
      );
    }

    const saved = await this.resource.updateOne(
      { ruid: resourceId },
      { $set: requestDto },
    );
    return Helpers.success(saved, 'Resource updated successfully');
  }

  async updateResourceStatus(
    authUser: AuthUserDto,
    resourceId: string,
    status: any,
    requestDto: ResourceStatusUpdateDto,
  ): Promise<ApiResponse> {
    const existingResource = await this.resource.findOne({
      ruid: resourceId,
    });

    if (!existingResource)
      return Helpers.error('Resource not found', 'BAD_REQUEST');

    const resourceOwner = await this.user.findOne({
      currentOwnerUuid: existingResource.currentOwnerUuid,
    });

    if (!resourceOwner)
      return Helpers.error('Resource owner not found', 'BAD_REQUEST');

    const authenticatedUser = await this.user.findOne({
      phoneNumber: authUser.username,
    });

    if (resourceOwner.uuid != authenticatedUser.uuid) {
      return Helpers.error(
        'You do not permission to update this resource',
        'BAD_REQUEST',
      );
    }

    if (!Object.values(Status).includes(status))
      return Helpers.error('Invalid status', 'BAD_REQUEST');

    const request = { lastStatusChange: requestDto, status: status };

    const statusChangeHistory = {
      ...requestDto,
      actionDate: new Date(),
      actionBy: authenticatedUser.uuid,
      actionByUser: authenticatedUser.name,
    };
    
    const saved = await this.resource.updateOne(
      { ruid: resourceId },
      {
        $set: request,
        $push: {
          statusChangeHistory: statusChangeHistory,
        },
      },
      { upsert: true },
    );

    return Helpers.success(saved, 'Resource updated successfully');
  }

  async changeResourceOwnership(
    authUser: AuthUserDto,
    resourceId: string,
    requestDto: ResourceOwnershipChangeDto,
  ): Promise<ApiResponse> {
    const existingResource = await this.resource.findOne({
      ruid: resourceId,
    });

    if (!existingResource)
      return Helpers.error('Resource not found', 'BAD_REQUEST');

    let resourceOwner = await this.user.findOne({
      uuid: requestDto.currentOwner,
    });

    if (!resourceOwner)
      resourceOwner = await this.user.findOne({
        code: requestDto.currentOwner,
      });

    if (!resourceOwner)
      resourceOwner = await this.user.findOne({
        phoneNUmber: requestDto.currentOwner,
      });

    if (!resourceOwner)
      return Helpers.error('Resource owner not found', 'BAD_REQUEST');

    if (resourceOwner.uuid != existingResource.currentOwnerUuid)
      return Helpers.error(
        'You do not have permission to change ownership of this resource',
        'BAD_REQUEST',
      );

    let newOwner = await this.user.findOne({
      uuid: requestDto.newOwner,
    });

    if (!newOwner)
      newOwner = await this.user.findOne({
        code: requestDto.newOwner,
      });

    if (!newOwner)
      newOwner = await this.user.findOne({
        phoneNUmber: requestDto.newOwner,
      });

    if (!newOwner) return Helpers.error('New owner not found', 'BAD_REQUEST');

    const authenticatedUser = await this.user.findOne({
      phoneNumber: authUser.username,
    });

    if (authenticatedUser.uuid != existingResource.currentOwnerUuid)
      return Helpers.error(
        'You do not have permission to change ownership of this resource',
        'BAD_REQUEST',
      );

    const request = {
      prevOwnerUuid: requestDto.currentOwner,
      currentOwnerUuid: requestDto.newOwner,
      lastOwnershipChangeDate: new Date(),
    } as any;

    const ownershipHistory = {
      ...requestDto,
      actionDate: new Date(),
      actionBy: authenticatedUser.uuid,
      actionByUser: authenticatedUser.name,
    } as any;

    const saved = await this.resource.updateOne(
      { ruid: resourceId },
      {
        $set: request,
        $push: {
          ownershipHistory: ownershipHistory,
        },
      },
      { upsert: true },
    );

    return Helpers.success(saved, 'Resource updated successfully');
  }

  async getMyResources(authUser: AuthUserDto): Promise<ApiResponse> {
    const resourceOwner = await this.user.findOne({
      uuid: authUser.sub,
    });

    if (!resourceOwner)
      return Helpers.error('Resource owner not found', 'BAD_REQUEST');

    const resources = await this.resource.find({
      currentOwnerUuid: resourceOwner.uuid,
    });
    if (resources && resources.length > 0)
      return Helpers.success(resources, 'Request  successful');

    return Helpers.error('No Resource found', 'NOT_FOUND');
  }

  async getResourceByRuid(
    authUser: AuthUserDto,
    ruid: string,
  ): Promise<ApiResponse> {
    const resource = await this.resource.findOne({ ruid });
    if (resource) return Helpers.success(resource, 'Request  successful');

    return Helpers.error('Resource not found', 'NOT_FOUND');
  }

  async getResourceByIdentityNumber(
    authUser: AuthUserDto,
    identityNumber: string,
  ): Promise<ApiResponse> {
    const resource = await this.resource.findOne({ identityNumber });
    if (resource) return Helpers.success(resource, 'Request  successful');

    return Helpers.error('Resource not found', 'NOT_FOUND');
  }

  async getResourceBySerialNumber(
    authUser: AuthUserDto,
    cattonSerialNumber: string,
  ): Promise<ApiResponse> {
    const resource = await this.resource.findOne({ cattonSerialNumber });
    if (resource) return Helpers.success(resource, 'Request  successful');

    return Helpers.error('Resource not found', 'NOT_FOUND');
  }

  async getResourceByCode(
    authUser: AuthUserDto,
    code: string,
  ): Promise<ApiResponse> {
    const resource = await this.resource.findOne({ code });
    if (resource) return Helpers.success(resource, 'Request  successful');

    return Helpers.error('Resource not found', 'NOT_FOUND');
  }
}
