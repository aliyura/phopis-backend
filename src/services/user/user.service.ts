import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';

import {
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

@Injectable()
export class UserService {
  cache = new NodeCache();
  constructor(
    @InjectModel(User.name) private user: Model<UserDocument>,
    private readonly cryptoService: CryptoService,
    private readonly smsService: SmsService,
  ) {}

  async createUser(requestDto: UserDto): Promise<ApiResponse> {
    try {
      const res = await this.existByPhoneOrEmail(
        requestDto.phoneNumber,
        requestDto.emailAddress,
      );

      if (res) return Helpers.no('Account already exist');

      //encrypt password
      const hash = await this.cryptoService.encrypt(requestDto.password);
      requestDto.password = hash;

      if (requestDto.accountType == AccountType.INDIVIDUAL) {
        if (requestDto.nin == null) return Helpers.no('NIN is required');

        if (!Helpers.validNin(requestDto.nin))
          return Helpers.no('NIN provided is not valid');
      }

      if (!Helpers.validPhoneNumber(requestDto.phoneNumber)) {
        return Helpers.no('Phone Number provided is not valid');
      }

      const request = {
        ...requestDto,
        status: Status.INACTIVE,
        role: UserRole.BUSINESS,
        code:
          requestDto.accountType == AccountType.BUSINESS
            ? `B${Helpers.getCode()}`
            : `I${Helpers.getCode()}`,
        uuid:
          requestDto.accountType == AccountType.BUSINESS
            ? `bis${Helpers.getUniqueId()}`
            : `ind${Helpers.getUniqueId()}`,
      } as any;

      const verificationOTP = Helpers.getCode();
      await this.cache.set(requestDto.phoneNumber, verificationOTP);

      //send otp to the user;
      await this.smsService.sendMessage(
        requestDto.phoneNumber,
        'Your OTP is ' + verificationOTP,
      );

      const savedAccount = await (await this.user.create(request)).save();
      return Helpers.yes(savedAccount);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async updateUser(userId: string, requestDto: UserUpdateDto): Promise<any> {
    try {
      if (requestDto && (requestDto.emailAddress || requestDto.phoneNumber)) {
        const res = await this.findByPhoneOrEmail(
          requestDto.phoneNumber,
          requestDto.emailAddress,
        );

        if (res && res.success) {
          return Helpers.no('Business already exist with ');
        }
      }

      const saved = await this.user.updateOne({ userId }, requestDto);
      return Helpers.yes(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async validateUser(requestDto: ValidateUserDto): Promise<ApiResponse> {
    try {
      const res = await this.findByPhone(requestDto.phoneNumber);
      if (res && res.success) {
        const verificationOTP = Helpers.getCode();
        await this.cache.set(requestDto.phoneNumber, verificationOTP);

        //send otp to the user;
        await this.smsService.sendMessage(
          requestDto.phoneNumber,
          'Your OTP is ' + verificationOTP,
        );

        return Helpers.yes(requestDto.phoneNumber);
      } else {
        return Helpers.no(Messages.UserNotFound);
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }
  async verifyUser(requestDto: VerifyUserDto): Promise<ApiResponse> {
    try {
      const res = await this.findByPhone(requestDto.phoneNumber);
      if (res && res.success) {
        const userOtp = requestDto.otp;
        const systemOtp = await this.cache.get(requestDto.phoneNumber); //stored OTP in memory
        console.log(userOtp, systemOtp);

        if (userOtp === systemOtp) {
          await this.user.updateOne(
            { uuid: res.data.uuid },
            { $set: { status: Status.ACTIVE } },
          );

          return Helpers.yes(res.data);
        } else {
          return Helpers.no('Invalid OTP');
        }
      } else {
        return Helpers.no(Messages.UserNotFound);
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse> {
    try {
      const res = await this.user.findOne({ uuid: userId }).exec();
      if (res) return Helpers.yes(res);

      return Helpers.no(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async findByPhone(phoneNumber: string): Promise<ApiResponse> {
    try {
      const res = await this.user.findOne({ phoneNumber }).exec();
      if (res) return Helpers.yes(res);

      return Helpers.no(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }
  async findByEmail(emailAddress: string): Promise<ApiResponse> {
    try {
      const res = await this.user.findOne({ emailAddress }).exec();
      if (res) return Helpers.yes(res);

      return Helpers.no(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }
  async findByPhoneOrEmail(
    phoneNumber: string,
    emailAddress: string,
  ): Promise<ApiResponse> {
    try {
      const emailUser = await this.user.findOne({ emailAddress }).exec();
      const phoneUser = await this.user.findOne({ phoneNumber }).exec();
      const result = emailUser ? emailUser : phoneUser;

      if (result) return Helpers.yes(result);

      return Helpers.no(Messages.UserNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }
  async existByPhoneOrEmail(
    phoneNumber: string,
    emailAddress: string,
  ): Promise<boolean> {
    try {
      const res = await this.user
        .findOne({
          $or: [{ phoneNumber, emailAddress }],
        })
        .exec();
      if (res) return true;
      return false;
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return false;
    }
  }
}
