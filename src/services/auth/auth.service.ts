import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CryptoService } from '../crypto/crypto.service';
import { User } from '../../schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { UserAuthDto } from '../../dtos/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private readonly cryptoService: CryptoService,
    private jwtService: JwtService,
  ) {}

  async validateUser(authRequest: UserAuthDto): Promise<User> {
    const user = await this.userService.findByPhoneOrEmail(
      authRequest.username,
      authRequest.username,
    );
    if (user) {
      const yes = await this.cryptoService.compare(
        user.password,
        authRequest.password,
      );
      if (yes) return user;
    }
    return null;
  }
  async login(authRequest: UserAuthDto): Promise<any> {
    const user = await this.validateUser(authRequest);
    if (user) {
      const payload = { username: authRequest.username, sub: user.businessId };
      delete user.password;
      const token = {
        access_token: this.jwtService.sign(payload),
        info: user,
      };
      return token;
    }
    return null;
  }
}
