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
import { ActionType, Status } from 'src/enums';
import {
  ResourceOwnershipChangeDto,
  VerifyResourceDto,
} from '../../dtos/resource.dto';
import { Messages } from 'src/utils/messages/messages';
import { CryptoService } from '../crypto/crypto.service';
import { WalletService } from '../wallet/wallet.service';
import { DebitWalletDto } from '../../dtos/wallet.dto';
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
    private cryptoService: CryptoService,
    private walletService: WalletService,
  ) {}
  async createResource(
    authenticatedUser: User,
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
    authenticatedUser: User,
    resourceId: string,
    requestDto: UpdateResourceDto,
  ): Promise<ApiResponse> {
    try {
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
        return Helpers.fail(Messages.NoPermission);
      }

      const updateHistory = {
        ...requestDto,
        actionType: ActionType.UPDATE,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };

      await this.resource.updateOne(
        { ruid: resourceId, uuid: authenticatedUser.uuid },
        {
          $set: requestDto,
          $push: {
            updateHistory: updateHistory,
          },
        },
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

  async deleteResource(
    authenticatedUser: User,
    resourceId: string,
  ): Promise<ApiResponse> {
    try {
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
        return Helpers.fail(Messages.NoPermission);

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

  async verifyResource(
    authenticatedUser: User,
    requestDto: VerifyResourceDto,
  ): Promise<ApiResponse> {
    try {
      //find the user
      const resourceOwner = await this.user.findOne({
        code: requestDto.ownerAccountNumber,
        $or: [
          {
            nin: requestDto.ownerIdentity,
          },
          { regNumber: requestDto.ownerIdentity },
        ],
      });
      if (!resourceOwner) {
        console.log('Resource owner not found');
        return Helpers.fail(
          'Verification failed -Invalid resource owner details',
        );
      }

      //find the resource
      const existingResource = await this.resource.findOne({
        code: requestDto.resourceNumber,
        currentOwnerUuid: resourceOwner.uuid,
      });
      if (!existingResource) {
        console.log('Resource not found');
        return Helpers.fail(
          'Verification failed -Resource not found or invalid owner details',
        );
      }

      const verificationCharge = Number(process.env.VERIFICATION_CHARGE);
      const transactionRef = `ver${Helpers.getUniqueId()}`;
      const walletDebitRequest = {
        address: resourceOwner.walletAddress,
        transactionId: transactionRef,
        channel: 'resource verification',
        amount: verificationCharge,
        narration: `Verification of ${existingResource.name}`,
      } as DebitWalletDto;
      const walletDebitResponse = await this.walletService.debitWallet(
        walletDebitRequest,
      );
      if (!walletDebitResponse.success)
        return Helpers.fail(
          `Verification failed -${walletDebitResponse.message}`,
        );

      const dateTime = new Date();
      const response = {
        verified: true,
        transactionRef: transactionRef,
        resourceDetail: existingResource,
        ownerDetail: {
          name: resourceOwner.name,
          phoneNumber: resourceOwner.phoneNumber,
          code: resourceOwner.code,
        },
      } as any;

      const verificationHistory = {
        verified: true,
        transactionRef: transactionRef,
        verificationRequest: requestDto,
        verifiedBy: authenticatedUser.uuid,
        verifiedByName: authenticatedUser.name,
        verifiedDate: dateTime.toISOString().slice(0, 10),
      } as any;

      await this.resource.updateOne(
        { ruid: existingResource.ruid },
        {
          $push: {
            verificationHistory: verificationHistory,
          },
        },
        { upsert: true },
      );

      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateResourceStatus(
    authenticatedUser: User,
    resourceId: string,
    status: any,
    requestDto: ResourceStatusUpdateDto,
  ): Promise<ApiResponse> {
    try {
      const existingResource = await this.resource.findOne({
        ruid: resourceId,
      });
      if (!existingResource) return Helpers.fail('Resource not found');

      const resourceOwner = await this.user.findOne({
        uuid: existingResource.currentOwnerUuid,
      });
      if (!resourceOwner) return Helpers.fail('Resource owner not found');

      if (resourceOwner.uuid != authenticatedUser.uuid) {
        return Helpers.fail(Messages.NoPermission);
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
        actionType: ActionType.UPDATE,
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
    authenticatedUser: User,
    resourceId: string,
    requestDto: ResourceOwnershipChangeDto,
  ): Promise<ApiResponse> {
    try {
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

      const updateHistory = {
        ...requestDto,
        actionType: ActionType.OWNERSHIPCHANGE,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };
      await this.resource.updateOne(
        { ruid: resourceId },
        {
          $set: request,
          $push: {
            ownershipHistory: ownershipHistory,
            updateHistory: updateHistory,
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
    authenticatedUser: User,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const query = {
        currentOwnerUuid: authenticatedUser.uuid,
      } as any;

      if (
        status &&
        Object.values(Status).includes(status.toUpperCase() as Status)
      ) {
        query.status = status.toUpperCase();
      }

      const resources = await this.resource.find(query);
      if (resources.length) return Helpers.success(resources);

      return Helpers.fail('No Resource found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchMyResources(
    authenticatedUser: User,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const resources = await this.resource.find({
        currentOwnerUuid: authenticatedUser.uuid,
        $text: { $search: searchString },
      });
      if (resources.length) return Helpers.success(resources);

      return Helpers.fail('No Resource found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getResourceByRuid(
    authenticatedUser: User,
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
    authenticatedUser: User,
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
    authenticatedUser: User,
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
    authenticatedUser: User,
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

  async getResourceOwnershipLog(authenticatedUser: User): Promise<ApiResponse> {
    try {
      const resources = await this.resourceOwnershipLog.find({
        ownerUuid: authenticatedUser.uuid,
      });
      if (resources.length) return Helpers.success(resources);

      return Helpers.fail('No Resource found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
