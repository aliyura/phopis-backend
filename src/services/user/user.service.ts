import { Model } from 'mongoose';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
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
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private user: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly cryptoService: CryptoService,
  ) {}

  async createUser(requestDto: UserDto): Promise<ApiResponse> {
    const res = await this.existByPhoneOrEmail(
      requestDto.phoneNumber,
      requestDto.emailAddress,
    );

    if (res) return Helpers.error('Account already exist', 'BAD_REQUEST');

    //encrypt password
    const hash = await this.cryptoService.encrypt(requestDto.password);
    requestDto.password = hash;

    if (requestDto.accountType == AccountType.INDIVIDUAL) {
      if (requestDto.nin == null)
        return Helpers.error('NIN is required', 'BAD_REQUEST');

      if (!Helpers.validNin(requestDto.nin))
        return Helpers.error('NIN provided is not valid', 'BAD_REQUEST');
    }

    if (!Helpers.validPhoneNumber(requestDto.phoneNumber)) {
      return Helpers.error('Phone Number provided is not valid', 'BAD_REQUEST');
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
    await this.cacheManager.set(requestDto.phoneNumber, verificationOTP); //store OTP in memory

    //send otp to the user;
    console.log('OTP', verificationOTP);

    const savedAccount = await (await this.user.create(request)).save();
    return Helpers.success(savedAccount, 'Account Created Successfully');
  }

  async updateUser(userId: string, requestDto: UserUpdateDto): Promise<any> {
    console.log('Updating user:', requestDto);

    if (requestDto && (requestDto.emailAddress || requestDto.phoneNumber)) {
      const res = await this.findByPhoneOrEmail(
        requestDto.phoneNumber,
        requestDto.emailAddress,
      );

      if (res && res.success) {
        return Helpers.error('Business already exist with ', 'BAD_REQUEST');
      }
    }

    const saved = await this.user.updateOne({ userId }, requestDto);
    return Helpers.success(saved, 'Account updated Successfully');
  }

  async validateUser(requestDto: ValidateUserDto): Promise<ApiResponse> {
    const res = await this.findByPhone(requestDto.phoneNumber);
    if (res && res.success) {
      const verificationOTP = Helpers.getCode();
      const ress = await this.cacheManager.set(
        requestDto.phoneNumber,
        verificationOTP,
      ); //store OTP in memory
      console.log(ress);
      //send otp to the user;
      console.log('OTP', verificationOTP);

      return Helpers.success(res.data, 'OTP sent to your phone number');
    } else {
      return Helpers.error('User not found', 'BAD_REQUEST');
    }
  }
  async verifyUser(requestDto: VerifyUserDto): Promise<ApiResponse> {
    const res = await this.findByPhone(requestDto.phoneNumber);
    if (res && res.success) {
      const userOtp = requestDto.otp;
      const systemOtp = await this.cacheManager.get(requestDto.phoneNumber); //store OTP in memory
      console.log(userOtp, systemOtp);

      if (userOtp === systemOtp) {
        await this.user.updateOne(
          { uuid: res.data.uuid },
          { $set: { status: Status.ACTIVE } },
        );

        return Helpers.success(res.data, 'User Verified Successfully');
      } else {
        return Helpers.error('Invalid OTP', 'BAD_REQUEST');
      }
    } else {
      return Helpers.error('User not found', 'BAD_REQUEST');
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse> {
    const res = await this.user.findOne({ uuid: userId }).exec();
    if (res) return Helpers.success(res, 'Request Successful');

    return Helpers.error('User not found', 'BAD_REQUEST');
  }

  async findByPhone(phoneNumber: string): Promise<ApiResponse> {
    const res = await this.user.findOne({ phoneNumber }).exec();
    if (res) return Helpers.success(res, 'Request Successful');

    return Helpers.error('User not found', 'BAD_REQUEST');
  }
  async findByEmail(emailAddress: string): Promise<ApiResponse> {
    const res = await this.user.findOne({ emailAddress }).exec();
    if (res) return Helpers.success(res, 'Request Successful');

    return Helpers.error('User not found', 'BAD_REQUEST');
  }
  async findByPhoneOrEmail(phone: string, email: string): Promise<ApiResponse> {
    const emailUser = await this.user.findOne({ email }).exec();
    const phoneUser = await this.user.findOne({ phone }).exec();
    const result = emailUser ? emailUser : phoneUser;

    if (result) return Helpers.success(result, 'Request Successful');

    return Helpers.error('User not found', 'BAD_REQUEST');
  }
  async existByPhoneOrEmail(
    phoneNumber: string,
    emailAddress: string,
  ): Promise<boolean> {
    const res = await this.user
      .findOne({
        $or: [{ phoneNumber, emailAddress }],
      })
      .exec();
    if (res) return true;
    return false;
  }
}
