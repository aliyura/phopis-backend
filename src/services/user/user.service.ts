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
import * as capitalize from 'string-capitalize';
import { Messages } from 'src/utils/messages/messages';
import { VerificationService } from '../verification/verification.service';
import { WalletService } from '../wallet/wallet.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  cache = new NodeCache();
  constructor(
    @InjectModel(User.name) private user: Model<UserDocument>,
    private readonly cryptoService: CryptoService,
    private readonly smsService: SmsService,
    private readonly verificationService: VerificationService,
    private readonly walletService: WalletService,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(requestDto: UserDto): Promise<ApiResponse> {
    try {
      const alreadyExistByPhone = await this.existByPhoneNumber(
        requestDto.phoneNumber,
      );
      if (alreadyExistByPhone) return Helpers.fail('Account already exist');

      if (requestDto.accountType == AccountType.INDIVIDUAL) {
        if (!requestDto.nin) return Helpers.fail('User NIN is required');

        const alreadyExistByNin = await this.existByNIN(requestDto.nin);
        if (alreadyExistByNin) return Helpers.fail('Account already exist');

        const ninResponse = await this.verificationService.verifyNIN(
          requestDto.nin,
        );

        if (ninResponse.success && ninResponse.data) {
          const ninDetails = ninResponse.data;
          const name = `${ninDetails.firstname} ${
            ninDetails.middlename === 'undefined' ? '' : ninDetails.middlename
          } ${ninDetails.surname === 'undefined' ? '' : ninDetails.surname}`;
          const address = `${ninDetails.residence_AdressLine1} ${ninDetails.residence_Town} `;

          requestDto.name = capitalize(name);
          requestDto.lga = capitalize(ninDetails.residence_lga);
          requestDto.state = capitalize(ninDetails.residence_state);
          requestDto.address = capitalize(address);
        } else {
          return Helpers.fail(ninResponse.message);
        }
      }
      //encrypt password
      const hash = await this.cryptoService.encryptPassword(
        requestDto.password,
      );
      requestDto.password = hash;

      if (requestDto.accountType == AccountType.INDIVIDUAL) {
        if (requestDto.nin == null) return Helpers.fail('NIN is required');

        if (!Helpers.validNin(requestDto.nin))
          return Helpers.fail('NIN provided is not valid');
      }

      if (!Helpers.validPhoneNumber(requestDto.phoneNumber)) {
        return Helpers.fail('Phone Number provided is not valid');
      }

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      )
        .toISOString()
        .slice(0, 10);

      const request = {
        ...requestDto,
        status: Status.INACTIVE,
        code: Helpers.getCode(),
        subscription: {
          startDate: startDate,
          endDate: endDate,
        },
        uuid:
          requestDto.accountType == AccountType.BUSINESS
            ? `bis${Helpers.getUniqueId()}`
            : `ind${Helpers.getUniqueId()}`,
      } as any;

      if (!requestDto.role) request.role = UserRole.USER;

      const account = await (await this.user.create(request)).save();
      if (account) {
        const walletResponse = await this.walletService.createWallet(
          account.uuid,
          account.code,
        );

        if (walletResponse.success) {
          //update user with wallet information
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

          const createdUser = await this.findByUserId(account.uuid);
          return Helpers.success(createdUser);
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
    requestDto: UserUpdateDto,
  ): Promise<any> {
    try {
      if (requestDto && requestDto.phoneNumber) {
        if (requestDto.phoneNumber !== authenticatedUser.phoneNumber) {
          const res = await this.findByPhoneNumber(requestDto.phoneNumber);

          if (res && res.success) {
            return Helpers.fail('Account already exist with this phone number');
          }
        }
      }

      const saved = await this.user.updateOne(
        { uuid: authenticatedUser.uuid },
        requestDto,
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
        console.log(userOtp, systemOtp);

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
          const hashedPassword = await this.cryptoService.encryptPassword(
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

  async findAllUsers(page: number, status: string): Promise<ApiResponse> {
    try {
      const size = 20;
      const skip = page || 0;

      const count = await this.user.count(status ? { status } : {});
      const result = await this.user
        .find(status ? { status } : {})
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

  async searchUsers(page: number, searchString: string): Promise<ApiResponse> {
    try {
      const size = 20;
      const skip = page || 0;

      const count = await this.user.count({ $text: { $search: searchString } });
      const result = await this.user
        .find({ $text: { $search: searchString } })
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
}
