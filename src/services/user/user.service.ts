import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';

import {
  AuthUserDto,
  ResetPasswordDto,
  UserDto,
  UserUpdateDto,
  ValidateUserDto,
  VerifyUserDto,
} from '../../dtos/user.dto';
import { ApiResponse } from '../../dtos/ApiResponse.dto';
import { CryptoService } from '../crypto/crypto.service';
import { Helpers } from 'src/helpers';
import { AccountType, Status, UserRole } from 'src/enums';
import { SmsService } from '../sms/sms.service';
import * as NodeCache from 'node-cache';
import { Messages } from 'src/utils/messages/messages';
import { WalletService } from '../wallet/wallet.service';
import { JwtService } from '@nestjs/jwt';
import {
  BusinessUserDto,
  UserBranchDto,
  ContactDetail,
} from '../../dtos/user.dto';
import { WalletActivity, ActionKey } from '../../enums/enums';
import { LogsService } from '../logs/logs.service';
import { AdditionalInfoRequest } from '../../dtos/additional-info-request.dto';
import { ServiceDetail, ProductDetail } from '../../dtos/user.dto';
import { Console } from 'console';

@Injectable()
export class UserService {
  cache = new NodeCache();
  constructor(
    @InjectModel(User.name) private user: Model<UserDocument>,
    private readonly cryptoService: CryptoService,
    private readonly smsService: SmsService,
    private readonly walletService: WalletService,
    private readonly jwtService: JwtService,
    private readonly logService: LogsService,
  ) {}

  async createUser(requestDto: UserDto): Promise<ApiResponse> {
    try {
      if (!Helpers.validPhoneNumber(requestDto.phoneNumber)) {
        return Helpers.fail('Phone Number provided is not valid');
      }

      if (requestDto.accountType == AccountType.INDIVIDUAL) {
        if (!requestDto.nin) return Helpers.fail('User NIN is required');

        const alreadyExistByNin = await this.existByNIN(requestDto.nin);
        if (alreadyExistByNin)
          return Helpers.fail('Account already exist with this NIN');
      }

      const alreadyExistByPhone = await this.existByPhoneNumber(
        requestDto.phoneNumber,
      );
      if (alreadyExistByPhone) return Helpers.fail('Account already exist');

      //encrypt password
      const hash = await this.cryptoService.encrypt(requestDto.password);
      requestDto.password = hash;

      if (requestDto.accountType == AccountType.ADMIN)
        return Helpers.fail(Messages.NoPermission);

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      )
        .toISOString()
        .slice(0, 10);

      if (requestDto.businessTarget && requestDto.businessTarget !== null)
        requestDto.businessTarget = requestDto.businessTarget.toUpperCase();

      const request = {
        ...requestDto,
        status: Status.INACTIVE,
        code: Helpers.getCode(),
        role:
          requestDto.accountType == AccountType.INDIVIDUAL
            ? UserRole.USER
            : UserRole.BUSINESS,

        uuid:
          requestDto.accountType == AccountType.BUSINESS
            ? `bis${Helpers.getUniqueId()}`
            : `ind${Helpers.getUniqueId()}`,
      } as User;

      //adding business id and business name
      if (requestDto.accountType === AccountType.BUSINESS) {
        request.businessId = request.uuid;
        request.business = request.name;
        request.subscription = {
          startDate: startDate,
          endDate: endDate,
        };
      }

      const account = await (await this.user.create(request)).save();
      if (account) {
        const walletResponse = await this.walletService.createWallet(
          account.uuid,
          account.code,
        );

        if (walletResponse.success) {
          const wallet = walletResponse.data;
          const nData = {
            walletAddress: wallet.address,
            walletCode: wallet.code,
          };

          await this.user.updateOne({ uuid: account.uuid }, nData);

          const verificationOTP = Helpers.getCode();
          await this.cache.set(requestDto.phoneNumber, verificationOTP);

          //send otp to the user;
          await this.smsService.sendMessage(
            requestDto.phoneNumber,
            'Your OTP is ' + verificationOTP,
          );

          const walletLog = {
            activity: WalletActivity.CREDIT,
            status: Status.SUCCESSFUL,
            uuid: wallet.uuid,
            sender: 'system',
            recipient: wallet.address,
            amount: 1000,
            ref: `ref${Helpers.getUniqueId()}`,
            channel: 'Transfer',
            narration: 'Starter bonus',
          } as any;

          await this.logService.saveWalletLog(walletLog);

          const createdUser = await this.findByUserId(account.uuid);
          return createdUser;
        } else {
          //removed saved user if process fail somewhere
          await this.user.deleteOne({ uuid: account.uuid });
          return Helpers.fail(walletResponse.message);
        }
      } else {
        return Helpers.fail('Unable to create your account');
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async createBusinessUser(
    authenticatedUser: User,
    requestDto: BusinessUserDto,
  ): Promise<ApiResponse> {
    try {
      if (!Helpers.validNin(requestDto.nin))
        return Helpers.fail('NIN provided is not valid');

      if (!Helpers.validPhoneNumber(requestDto.phoneNumber)) {
        return Helpers.fail('Phone Number provided is not valid');
      }
      if (authenticatedUser.role !== UserRole.BUSINESS) {
        return Helpers.fail(Messages.NoPermission);
      }

      const alreadyExistByPhone = await this.existByPhoneNumber(
        requestDto.phoneNumber,
      );
      if (alreadyExistByPhone)
        return Helpers.fail('Account already exist with this phone number');

      const alreadyExistByNin = await this.existByNIN(requestDto.nin);
      if (alreadyExistByNin)
        return Helpers.fail('Account already exist with this NIN');

      //encrypt password
      const hash = await this.cryptoService.encrypt(requestDto.password);
      requestDto.password = hash;

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      )
        .toISOString()
        .slice(0, 10);

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        businessId: authenticatedUser.businessId,
        business: authenticatedUser.name,
        accountType: AccountType.BUSINESS,
        walletAddress: authenticatedUser.walletAddress,
        walletCode: authenticatedUser.walletCode,
        role: UserRole.USER,
        code: Helpers.getCode(),
        subscription: {
          startDate: startDate,
          endDate: endDate,
        },
        uuid: `biu${Helpers.getUniqueId()}`,
      } as User;

      const account = await (await this.user.create(request)).save();
      return Helpers.success(account);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async createUserBranch(
    authenticatedUser: User,
    requestDto: UserBranchDto,
  ): Promise<ApiResponse> {
    try {
      if (!Helpers.validPhoneNumber(requestDto.phoneNumber)) {
        return Helpers.fail('Phone Number provided is not valid');
      }
      if (authenticatedUser.role !== UserRole.BUSINESS) {
        return Helpers.fail(Messages.NoPermission);
      }
      const alreadyExistByPhone = await this.existByPhoneNumber(
        requestDto.phoneNumber,
      );
      if (alreadyExistByPhone)
        return Helpers.fail('Phone number already exist');

      //encrypt password
      const hash = await this.cryptoService.encrypt(requestDto.password);
      requestDto.password = hash;

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      )
        .toISOString()
        .slice(0, 10);
      const branchId = `bib${Helpers.getUniqueId()}`;

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        businessId: authenticatedUser.businessId,
        business: authenticatedUser.name,
        branchId: branchId,
        branch: requestDto.name,
        businessType: authenticatedUser.businessType,
        accountType: AccountType.BUSINESS,
        role: UserRole.BUSINESS,
        code: Helpers.getCode(),
        subscription: {
          startDate: startDate,
          endDate: endDate,
        },
        uuid: `bib${Helpers.getUniqueId()}`,
      } as any;

      const account = await (await this.user.create(request)).save();
      if (account) {
        const walletResponse = await this.walletService.createWallet(
          account.uuid,
          account.code,
        );

        if (walletResponse.success) {
          const wallet = walletResponse.data;
          const nData = {
            walletAddress: wallet.address,
            walletCode: wallet.code,
          };

          await this.user.updateOne({ uuid: account.uuid }, nData);

          const createdUser = await this.findByUserId(account.uuid);
          return createdUser;
        } else {
          //removed saved user if process fail somewhere
          await this.user.deleteOne({ uuid: account.uuid });
          return Helpers.fail(walletResponse.message);
        }
      } else {
        return Helpers.fail('Unable to create your account');
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateUser(
    authenticatedUser: User,
    userId: string,
    requestDto: UserUpdateDto,
  ): Promise<any> {
    try {
      const userResponse = await this.findByUserId(userId);
      if (userResponse.success) {
        const user = userResponse.data;

        if (requestDto && requestDto.phoneNumber) {
          if (
            requestDto.phoneNumber !== authenticatedUser.phoneNumber &&
            requestDto.phoneNumber !== user.phoneNumber
          ) {
            const res = await this.findByPhoneNumber(requestDto.phoneNumber);
            if (res && res.success) {
              return Helpers.fail(
                'Account already exist with this phone number',
              );
            }
          }
        }

        const saved = await this.user.updateOne({ uuid: userId }, requestDto);
        return Helpers.success(saved);
      } else {
        return Helpers.fail(Messages.UserNotFound);
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async createPIN(authenticatedUser: User, pin: string): Promise<any> {
    try {
      if (!pin || pin.length < 4) return Helpers.fail('Valid pin required');

      const hashedPin = await this.cryptoService.encrypt(pin);
      await this.user.updateOne(
        { uuid: authenticatedUser.uuid },
        { pin: hashedPin },
      );

      //return with the latest updated user object
      const response = await this.user.findOne({
        uuid: authenticatedUser.uuid,
      });
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async verifyPIN(authenticatedUser: User, pin: string): Promise<any> {
    try {
      if (!pin || pin.length < 4) return Helpers.fail('Invalid PIN');

      const hashedPin = authenticatedUser.pin;
      const yes = await this.cryptoService.compare(hashedPin, pin);
      if (yes) return Helpers.success(authenticatedUser);

      return Helpers.fail('Invalid PIN');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async activateUser(authenticatedUser: User, userId: string): Promise<any> {
    try {
      if (authenticatedUser.role == UserRole.USER)
        return Helpers.fail(Messages.NoPermission);

      const saved = await this.user.updateOne(
        { uuid: userId },
        { status: Status.ACTIVE },
      );
      this.smsService.sendMessage(
        authenticatedUser.phoneNumber,
        'Welcome to Phopis, manage your resources and  businesses in one place',
      );

      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deactivateUser(authenticatedUser: User, userId: string): Promise<any> {
    try {
      if (authenticatedUser.role == UserRole.USER)
        return Helpers.fail(Messages.NoPermission);

      const saved = await this.user.updateOne(
        { uuid: userId },
        { status: Status.INACTIVE },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async validateUser(requestDto: ValidateUserDto): Promise<ApiResponse> {
    try {
      const res = await this.findByPhoneNumberOrNin(requestDto.username);
      if (res && res.success) {
        const user = res.data as User;
        const verificationOTP = Helpers.getCode();
        await this.cache.set(requestDto.username, verificationOTP);

        //send otp to the user;
        await this.smsService.sendMessage(
          user.phoneNumber,
          'Your OTP is ' + verificationOTP,
        );

        return Helpers.success(user.phoneNumber);
      } else {
        return Helpers.fail(Messages.UserNotFound);
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
  async verifyUser(requestDto: VerifyUserDto): Promise<ApiResponse> {
    try {
      const res = await this.findByPhoneNumberOrNin(requestDto.username);
      if (res && res.success) {
        const userOtp = requestDto.otp;
        const systemOtp = await this.cache.get(requestDto.username); //stored OTP in memory

        if (userOtp == systemOtp) {
          await this.user.updateOne(
            { uuid: res.data.uuid },
            { $set: { status: Status.ACTIVE } },
          );

          this.cache.del(requestDto.username);
          const updatedUser = await this.user.findOne({ uuid: res.data.uuid });
          return Helpers.success(updatedUser);
        } else {
          return Helpers.fail('Invalid OTP or expired');
        }
      } else {
        return Helpers.fail(Messages.UserNotFound);
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async resetPassword(requestDto: ResetPasswordDto): Promise<ApiResponse> {
    try {
      const res = await this.findByPhoneNumberOrNin(requestDto.username);
      if (res && res.success) {
        const systemOtp = await this.cache.get(requestDto.username); //stored OTP in memory

        if (requestDto.otp == systemOtp) {
          const hashedPassword = await this.cryptoService.encrypt(
            requestDto.password,
          );

          await this.user.updateOne(
            { uuid: res.data.uuid },
            { $set: { password: hashedPassword } },
          );

          this.cache.del(requestDto.username);
          return Helpers.success(res.data);
        } else {
          return Helpers.fail('Invalid OTP or Expired');
        }
      } else {
        return Helpers.fail(Messages.UserNotFound);
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async authenticatedUserByToken(authToken: string): Promise<ApiResponse> {
    try {
      const user = (await this.jwtService.decode(authToken)) as AuthUserDto;
      const response = await this.findByPhoneNumberOrNin(user.username);
      if (response.success) {
        const user = response.data as User;
        if (user.status === Status.ACTIVE) {
          return Helpers.success(user);
        } else {
          return Helpers.fail('User is InActive');
        }
      }
      return Helpers.fail(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async addAdditionalInfo(
    authenticatedUser: User,
    requestDto: AdditionalInfoRequest,
  ): Promise<ApiResponse> {
    try {
      const user = authenticatedUser;

      if (!requestDto.key || !requestDto.value)
        return Helpers.fail('Provide valid key value details');
      if (!user.additionalInfo) user.additionalInfo = {} as any;

      if (requestDto.key === ActionKey.CONTACT) {
        const contacts = user.additionalInfo.contacts || [];
        const request = requestDto.value as ContactDetail;
        const alreadyExist = await contacts.some((data) => {
          return data.value === request.value;
        });
        if (alreadyExist) return Helpers.fail('Contact already exist');

        request.id = `cont${Helpers.getUniqueId()}`;
        contacts.push(request);
        user.additionalInfo.contacts = contacts;
      } else if (requestDto.key === ActionKey.SERVICE) {
        const services = user.additionalInfo.services || [];
        const request = requestDto.value as ServiceDetail;
        const alreadyExist = await services.some((data) => {
          return data.title === request.title;
        });
        if (alreadyExist) return Helpers.fail('Service already exist');

        request.id = `serv${Helpers.getUniqueId()}`;
        services.push(request);
        user.additionalInfo.services = services;
      } else if (requestDto.key === ActionKey.PRODUCT) {
        const products = user.additionalInfo.products || [];
        const request = requestDto.value as ProductDetail;
        const alreadyExist = await products.some((data) => {
          return data.title === request.title;
        });
        if (alreadyExist) return Helpers.fail('Product already exist');

        request.id = `prod${Helpers.getUniqueId()}`;
        products.push(request);
        user.additionalInfo.services = products;
      } else if (requestDto.key === ActionKey.KEYWORD) {
        const keywords = user.additionalInfo.keywords || [];
        const request = requestDto.value || ([] as string[]);
        const alreadyExist = keywords.some((data) => request.includes(data));
        if (alreadyExist) return Helpers.fail('Some keyword already exist');

        const keywordBase = keywords.concat(request);
        user.additionalInfo.keywords = keywordBase;
      } else if (requestDto.key === ActionKey.PRIMARYCOLOR) {
        user.additionalInfo.primaryColor = requestDto.value;
      } else if (requestDto.key === ActionKey.SECONDARYCOLOR) {
        user.additionalInfo.secondaryColor = requestDto.value;
      } else if (requestDto.key === ActionKey.LOGO) {
        user.additionalInfo.logo = requestDto.value;
      } else if (requestDto.key === ActionKey.DESCRIPTION) {
        user.additionalInfo.description = requestDto.value;
      } else {
        return Helpers.fail('Invalid request key');
      }
      const saved = await (await this.user.create(user)).save();
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateAdditionalInfo(
    authenticatedUser: User,
    requestDto: AdditionalInfoRequest,
  ): Promise<ApiResponse> {
    try {
      const user = authenticatedUser;

      if (!requestDto.key || !requestDto.value)
        return Helpers.fail('Provide valid key value details');
      if (!user.additionalInfo) user.additionalInfo = {} as any;

      if (requestDto.key === ActionKey.CONTACT) {
        const contacts = user.additionalInfo.contacts || [];
        const request = requestDto.value as ContactDetail;
        const existingContact = await contacts.find(
          (item) => item.id === request.id,
        );
        if (!existingContact) return Helpers.fail('Contact not found');

        if (request.value) existingContact.value = request.value;

        const base = await contacts.filter((item) => item.id !== request.id);
        base.push(existingContact);
        user.additionalInfo.contacts = base;
      } else if (requestDto.key === ActionKey.SERVICE) {
        const services = user.additionalInfo.services || [];
        const request = requestDto.value as ServiceDetail;
        const existingService = await services.find(
          (item) => item.id === request.id,
        );
        if (!existingService) return Helpers.fail('Service not found');

        if (request.title) existingService.title = request.title;
        if (request.image) existingService.image = request.image;
        if (request.description)
          existingService.description = request.description;

        const base = await services.filter((item) => item.id !== request.id);
        base.push(existingService);
        user.additionalInfo.services = base;
      } else if (requestDto.key === ActionKey.PRODUCT) {
        const products = user.additionalInfo.products || [];
        const request = requestDto.value as ProductDetail;
        const existingProduct = await products.find(
          (item) => item.id === request.id,
        );
        if (!existingProduct) return Helpers.fail('Product not found');

        if (request.title) existingProduct.title = request.title;
        if (request.image) existingProduct.image = request.image;
        if (request.price) existingProduct.price = request.price;
        if (request.description)
          existingProduct.description = request.description;

        const base = await products.filter((item) => item.id !== request.id);
        base.push(existingProduct);
        user.additionalInfo.products = base;
      } else if (requestDto.key === ActionKey.PRIMARYCOLOR) {
        user.additionalInfo.primaryColor = requestDto.value;
      } else if (requestDto.key === ActionKey.SECONDARYCOLOR) {
        user.additionalInfo.secondaryColor = requestDto.value;
      } else if (requestDto.key === ActionKey.LOGO) {
        user.additionalInfo.logo = requestDto.value;
      } else if (requestDto.key === ActionKey.DESCRIPTION) {
        user.additionalInfo.description = requestDto.value;
      } else {
        return Helpers.fail('Invalid request key');
      }
      const saved = await (await this.user.create(user)).save();
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteAdditionalInfo(
    authenticatedUser: User,
    requestDto: AdditionalInfoRequest,
  ): Promise<ApiResponse> {
    try {
      const user = authenticatedUser;

      if (!requestDto.key || !requestDto.value)
        return Helpers.fail('Provide valid key value details');
      if (!user.additionalInfo) user.additionalInfo = {} as any;

      if (requestDto.key === ActionKey.CONTACT) {
        const contacts = user.additionalInfo.contacts || [];
        const id = requestDto.value as string;
        const exist = await contacts.find((item) => item.id === id);
        if (!exist) return Helpers.fail('Contact not found');
        const base = await contacts.filter((item) => item.id !== id);
        user.additionalInfo.contacts = base;
      } else if (requestDto.key === ActionKey.SERVICE) {
        const services = user.additionalInfo.services || [];
        const id = requestDto.value as string;
        const exist = await services.find((item) => item.id === id);
        if (!exist) return Helpers.fail('Service not found');

        const base = await services.filter((item) => item.id !== id);
        user.additionalInfo.services = base;
      } else if (requestDto.key === ActionKey.PRODUCT) {
        const products = user.additionalInfo.products || [];
        const id = requestDto.value as string;
        const existingProduct = await products.find((item) => item.id === id);
        if (!existingProduct) return Helpers.fail('Product not found');

        const base = await products.filter((item) => item.id !== id);
        user.additionalInfo.products = base;
      } else if (requestDto.key === ActionKey.PRIMARYCOLOR) {
        user.additionalInfo.primaryColor = null;
      } else if (requestDto.key === ActionKey.SECONDARYCOLOR) {
        user.additionalInfo.secondaryColor = null;
      } else if (requestDto.key === ActionKey.LOGO) {
        user.additionalInfo.logo = null;
      } else if (requestDto.key === ActionKey.DESCRIPTION) {
        user.additionalInfo.description = null;
      } else {
        return Helpers.fail('Invalid request key');
      }
      const saved = await (await this.user.create(user)).save();
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
  async findByUserId(userId: string): Promise<ApiResponse> {
    try {
      const response = await this.user.findOne({ uuid: userId }).exec();
      if (response) return Helpers.success(response);

      return Helpers.fail(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findByUserCode(code: number): Promise<ApiResponse> {
    try {
      const response = await this.user.findOne({ code }).exec();
      if (response) return Helpers.success(response);

      return Helpers.fail(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<ApiResponse> {
    try {
      const response = await this.user.findOne({ phoneNumber }).exec();

      if (response) return Helpers.success(response);

      return Helpers.fail(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
  async findByPhoneNumberOrNin(request: string): Promise<ApiResponse> {
    try {
      const response = await this.user
        .findOne({ $or: [{ phoneNumber: request }, { nin: request }] })
        .exec();

      if (response) return Helpers.success(response);

      return Helpers.fail(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async existByPhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.user.findOne({ phoneNumber }).exec();
      if (response) return true;
      return false;
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return false;
    }
  }

  async existByNIN(nin: string): Promise<boolean> {
    try {
      const res = await this.user.findOne({ nin }).exec();
      if (res) return true;
      return false;
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return false;
    }
  }

  async findAllUsers(
    authenticatedUser: User,
    page: number,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const size = 20;
      const skip = page || 0;

      if (authenticatedUser.role === UserRole.USER) {
        return Helpers.fail(Messages.NoPermission);
      }

      const query = status ? ({ status } as any) : ({} as any);
      query.branchId = { $exists: false };

      if (authenticatedUser.role === UserRole.BUSINESS) {
        query.businessId = authenticatedUser.businessId;
      }

      const count = await this.user.count(query);
      const result = await this.user
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

      return Helpers.fail(Messages.NoUserFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchUsers(
    authenticatedUser: User,
    page: number,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const size = 20;
      const skip = page || 0;

      if (authenticatedUser.role === UserRole.USER) {
        return Helpers.fail(Messages.NoPermission);
      }

      const query = { $text: { $search: searchString } } as any;
      query.branchId = { $exists: false };
      if (authenticatedUser.role === UserRole.BUSINESS) {
        query.businessId = authenticatedUser.businessId;
      }

      const count = await this.user.count(query);
      const result = await this.user
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

      return Helpers.fail(Messages.NoUserFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findAllUserBranches(
    authenticatedUser: User,
    page: number,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const size = 20;
      const skip = page || 0;

      if (authenticatedUser.role === UserRole.USER) {
        return Helpers.fail(Messages.NoPermission);
      }

      const query = status ? ({ status } as any) : ({} as any);
      query.branchId = { $exists: true }; //filter only branches here

      if (authenticatedUser.role === UserRole.BUSINESS) {
        query.businessId = authenticatedUser.businessId;
      }

      const count = await this.user.count(query);
      const result = await this.user
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

      return Helpers.fail(Messages.NoUserFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchUserBranches(
    authenticatedUser: User,
    page: number,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const size = 20;
      const skip = page || 0;

      if (authenticatedUser.role === UserRole.USER) {
        return Helpers.fail(Messages.NoPermission);
      }

      const query = { $text: { $search: searchString } } as any;
      query.branchId = { $exists: true }; //filter only branches here

      if (authenticatedUser.role === UserRole.BUSINESS) {
        query.businessId = authenticatedUser.businessId;
      }

      const count = await this.user.count(query);
      const result = await this.user
        .find(query)
        .skip(skip * size)
        .limit(size);

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

      return Helpers.fail(Messages.NoUserFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
