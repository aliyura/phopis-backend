import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CryptoService } from '../crypto/crypto.service';
import { User } from '../../schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { UserAuthDto } from '../../dtos/user.dto';
import { ApiResponse } from '../../dtos/ApiResponse.dto';
import { Helpers } from '../../helpers/utitlity.helpers';
import { Status } from 'src/enums';
import { Messages } from 'src/utils/messages/messages';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private readonly cryptoService: CryptoService,
    private jwtService: JwtService,
  ) {}

  async validateUser(authRequest: UserAuthDto): Promise<ApiResponse> {
    try {
      const res = await this.userService.findByPhoneNumberOrNin(
        authRequest.username,
      );

      if (res.success) {
        const user = res.data as User;

        if (user.status == Status.ACTIVE) {
          const yes = await this.cryptoService.compare(
            user.password,
            authRequest.password,
          );
          if (yes) return Helpers.success(user);
        } else {
          return Helpers.fail(
            'Account is InActive, Kindly activate your account',
          );
        }
      }
      return Helpers.fail(Messages.InvalidCredentials);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
  async login(authRequest: UserAuthDto): Promise<ApiResponse> {
    try {
      const res = await this.validateUser(authRequest);
      if (res.success) {
        const user = res.data as User;
        const payload = { username: user.phoneNumber, sub: user.uuid };
        delete user.password;

        //cont business information
        let business = null;
        if (user.businessId) {
          const res = await this.userService.findByUserId(user.businessId);
          if (res.success) {
            business = res.data;
          }
        }

        //enrich token
        if (business) {
          user.businessTarget = business.businessTarget;
          user.businessType = business.businessType;
        }

        const token = {
          access_token: this.jwtService.sign(payload),
          info: user,
        };
        const result = Helpers.success(token);
        return result;
      } else {
        return Helpers.fail(res.message);
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
