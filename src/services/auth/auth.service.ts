import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CryptoService } from '../crypto/crypto.service';
import { User } from '../../schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { UserAuthDto } from '../../dtos/user.dto';
import { ApiResponse } from '../../dtos/ApiResponse.dto';
import { Helpers } from '../../helpers/utitlity.helpers';
import { Status } from 'src/enums';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private readonly cryptoService: CryptoService,
    private jwtService: JwtService,
  ) {}

  async validateUser(authRequest: UserAuthDto): Promise<ApiResponse> {
    const res = await this.userService.findByPhoneOrEmail(
      authRequest.username,
      authRequest.username,
    );

    if (res) {
      const user = res.data as User;

      if (user.status == Status.ACTIVE) {
        const yes = await this.cryptoService.compare(
          user.password,
          authRequest.password,
        );
        if (yes) return Helpers.success(user, 'User Authenticated');
      } else {
        return Helpers.error(
          'Account is InActive, Kindly activate your account',
          'UNAUTHORIZED',
        );
      }
    }
    return Helpers.error('Invalid Username or Password', 'UNAUTHORIZED');
  }
  async login(authRequest: UserAuthDto): Promise<ApiResponse> {
    const res = await this.validateUser(authRequest);
    if (res.success) {
      const user = res.data as User;
      const payload = { username: user.phoneNumber, sub: user.uuid };
      delete user.password;
      const token = {
        access_token: this.jwtService.sign(payload),
        info: user,
      };
      return Helpers.success(token, 'Authentication Successful');
    } else {
      return Helpers.error(res.message, 'UNAUTHORIZED');
    }
  }
}
