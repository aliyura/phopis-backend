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
import { UnitService } from '../unit/unit.service';
import { JwtService } from '@nestjs/jwt';
import { BusinessUserDto, UserBranchDto, KeyValue } from '../../dtos/user.dto';
import { UnitActivity, ActionKey } from '../../enums/enums';
import { LogsService } from '../logs/logs.service';
import { AdditionalInfoRequest } from '../../dtos/additional-info-request.dto';
import { ServiceDetail, ProductDetail } from '../../dtos/user.dto';
import { FundUnitDto } from '../../dtos/unit.dto';

@Injectable()
export class UserService {
  cache = new NodeCache();
  constructor(
    @InjectModel(User.name) private user: Model<UserDocument>,
    private readonly cryptoService: CryptoService,
    private readonly smsService: SmsService,
    private readonly unitService: UnitService,
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

      if (requestDto.referee) {
        const refereeExist = await this.findByUserCode(requestDto.referee);
        if (!refereeExist) return Helpers.fail('Invalid referral code');
      }

      if (requestDto.businessTarget && requestDto.businessTarget !== null)
        requestDto.businessTarget = requestDto.businessTarget.toUpperCase();

      const request = {
        ...requestDto,
        status:
          requestDto.accountType === AccountType.INDIVIDUAL
            ? Status.INACTIVE
            : Status.ACTIVE,
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
      }

      const account = await (await this.user.create(request)).save();

      if (account) {
        //pay referee
        if (account.referee && account.accountType === AccountType.BUSINESS) {
          const referredUser = await this.findByUserCode(account.referee);
          if (referredUser.success) {
            //credit the refereed user
            const fundingRequest = {
              accountId: account.businessId || account.uuid,
              unitAddress: account.unitAddress,
              paymentRef: `pay${Helpers.getUniqueId()}`,
              transactionId: Helpers.getCode(),
              channel: 'Referral program',
              amount: 100,
            } as FundUnitDto;

            await this.unitService.fundUnit(fundingRequest);
          } else {
            console.error('Referred user not found');
          }
        }

        const unitResponse = await this.unitService.createUnitAccount(
          account.uuid,
          account.code,
        );

        if (unitResponse.success) {
          const unit = unitResponse.data;
          const nData = {
            unitAddress: unit.address,
            unitCode: unit.code,
          };

          await this.user.updateOne({ uuid: account.uuid }, nData);

          if (account.accountType === AccountType.INDIVIDUAL) {
            const verificationOTP = Helpers.getCode();
            await this.cache.set(requestDto.phoneNumber, verificationOTP);

            //send otp to the user;
            await this.smsService.sendMessage(
              requestDto.phoneNumber,
              'Your OTP is ' + verificationOTP,
            );
          }

          const unitLog = {
            activity: UnitActivity.CREDIT,
            status: Status.SUCCESSFUL,
            uuid: unit.uuid,
            sender: 'system',
            recipient: unit.address,
            amount: 1000,
            ref: `ref${Helpers.getUniqueId()}`,
            channel: 'Transfer',
            narration: 'Starter bonus',
          } as any;

          await this.logService.saveUnitLog(unitLog);

          const createdUser = await this.findByUserId(account.uuid);
          return createdUser;
        } else {
          await this.user.deleteOne({ uuid: account.uuid });
          return Helpers.fail(unitResponse.message);
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

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        businessId: authenticatedUser.businessId,
        business: authenticatedUser.name,
        accountType: AccountType.BUSINESS,
        businessTarget: authenticatedUser.businessTarget,
        unitAddress: authenticatedUser.unitAddress,
        unitCode: authenticatedUser.unitCode,
        role: UserRole.USER,
        code: Helpers.getCode(),
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
        businessTarget: authenticatedUser.businessTarget,
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
        const unitResponse = await this.unitService.createUnitAccount(
          account.uuid,
          account.code,
        );

        if (unitResponse.success) {
          const unit = unitResponse.data;
          const nData = {
            unitAddress: unit.address,
            unitCode: unit.code,
          };

          await this.user.updateOne({ uuid: account.uuid }, nData);

          const createdUser = await this.findByUserId(account.uuid);
          return createdUser;
        } else {
          //removed saved user if process fail somewhere
          await this.user.deleteOne({ uuid: account.uuid });
          return Helpers.fail(unitResponse.message);
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
        const request = {} as any;

        if (requestDto.alias && requestDto.alias != '') {
          let alias = requestDto.alias.replace('\\s', '');
          alias = alias.toLowerCase();
          requestDto.alias = alias;
        }

        if (requestDto.alias && requestDto.alias != '') {
          const aliasUser = await this.findByAlias(requestDto.alias);
          if (aliasUser.success) {
            const aliasUserProfile = aliasUser.data;
            if (aliasUserProfile.uuid !== user.uuid) {
              return Helpers.fail('This alias is already taken');
            }
          }
        }

        const additionalInfo = {} as any;

        if (requestDto.name && requestDto.name !== '')
          request.name = requestDto.name;
        if (requestDto.alias && requestDto.alias !== '')
          request.alias = requestDto.alias;
        if (requestDto.address && requestDto.address !== '')
          request.address = requestDto.address;
        if (requestDto.dp && requestDto.dp !== '') {
          request.dp = requestDto.dp;
          additionalInfo.logo = requestDto.dp;
        }

        //update additional information
        if (requestDto.shortDescription && requestDto.shortDescription !== '')
          additionalInfo.shortDescription = requestDto.shortDescription;

        if (requestDto.description && requestDto.description !== '')
          additionalInfo.description = requestDto.description;

        if (requestDto.color && requestDto.color !== '')
          additionalInfo.color = requestDto.color;

        if (requestDto.map && requestDto.map !== '')
          additionalInfo.map = requestDto.map;

        request.additionalInfo = additionalInfo;

        await this.user.updateOne({ uuid: userId }, request);
        return Helpers.success(await this.user.findOne({ uuid: userId }));
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

  async deleteUser(authenticatedUser: User, userId: string): Promise<any> {
    try {
      if (authenticatedUser.role == UserRole.USER)
        return Helpers.fail(Messages.NoPermission);

      const user = await this.user.findOne({ uuid: userId });
      if (!user) return Helpers.fail(Messages.NoUserFound);

      await this.user.deleteOne({ uuid: userId });
      await this.unitService.deleteUnit(user.unitAddress);

      return Helpers.success('User deleted successfully');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deactivateUser(authenticatedUser: User, userId: string): Promise<any> {
    try {
      if (authenticatedUser.role == UserRole.USER)
        return Helpers.fail(Messages.NoPermission);

      const user = await this.user.findOne({ uuid: userId });
      if (!user) return Helpers.fail(Messages.NoUserFound);

      const saved = await this.user.updateOne(
        { uuid: userId },
        { status: Status.INACTIVE },
      );

      //send otp to the user;
      await this.smsService.sendMessage(
        user.phoneNumber,
        'Your account has been deactivated',
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
        const user = res.data;
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
        const request = requestDto.value as KeyValue;
        const alreadyExist = await contacts.some((data) => {
          return data.value === request.value;
        });
        if (alreadyExist) return Helpers.fail('Contact already exist');

        request.id = `cont${Helpers.getUniqueId()}`;
        contacts.push(request);
        user.additionalInfo.contacts = contacts;
      } else if (requestDto.key === ActionKey.SOCIALMEDIALINK) {
        const links = user.additionalInfo.socialMediaLinks || [];
        const request = requestDto.value as KeyValue;
        const alreadyExist = await links.some((data) => {
          return data.value === request.value;
        });
        if (alreadyExist) return Helpers.fail('Link already exist');

        request.id = `link${Helpers.getUniqueId()}`;
        links.push(request);
        user.additionalInfo.socialMediaLinks = links;
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
        user.additionalInfo.products = products;
      } else if (requestDto.key === ActionKey.KEYWORD) {
        const keywords = user.additionalInfo.keywords || [];
        const request = requestDto.value || ([] as string[]);
        const alreadyExist = keywords.some((data) => request.includes(data));
        if (alreadyExist) return Helpers.fail('Some keyword already exist');

        const keywordBase = keywords.concat(request);
        user.additionalInfo.keywords = keywordBase;
      } else {
        return Helpers.fail('Invalid request key');
      }
      await this.user.updateOne({ uuid: authenticatedUser.uuid }, user);
      return Helpers.success(
        await this.user.findOne({ uuid: authenticatedUser.uuid }),
      );
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
      } else if (requestDto.key === ActionKey.SOCIALMEDIALINK) {
        const links = user.additionalInfo.socialMediaLinks || [];
        const id = requestDto.value as string;
        const exist = await links.find((item) => item.id === id);
        if (!exist) return Helpers.fail('Link not found');
        const base = await links.filter((item) => item.id !== id);
        user.additionalInfo.socialMediaLinks = base;
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
      } else {
        return Helpers.fail('Invalid request key');
      }
      await this.user.updateOne({ uuid: authenticatedUser.uuid }, user);
      return Helpers.success(
        await this.user.findOne({ uuid: authenticatedUser.uuid }),
      );
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

  async findByAlias(alias: string): Promise<ApiResponse> {
    try {
      const response = await this.user.findOne({ alias }).exec();
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
      if (authenticatedUser.accountType !== AccountType.ADMIN) {
        query.businessId =
          authenticatedUser.businessId || authenticatedUser.uuid;
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
      if (authenticatedUser.accountType !== AccountType.ADMIN) {
        query.businessId =
          authenticatedUser.businessId || authenticatedUser.uuid;
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

  async searchBusiness(
    page: number,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const size = 50;
      const skip = page || 0;

      const query = {
        accountType: AccountType.BUSINESS,
        role: UserRole.BUSINESS,
        $text: { $search: searchString },
      };

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

      return Helpers.fail('Search not found');
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
      if (authenticatedUser.accountType !== AccountType.ADMIN) {
        query.businessId =
          authenticatedUser.businessId || authenticatedUser.uuid;
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
      if (authenticatedUser.accountType !== AccountType.ADMIN) {
        query.businessId =
          authenticatedUser.businessId || authenticatedUser.uuid;
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
