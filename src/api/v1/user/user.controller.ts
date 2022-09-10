import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { UserDto } from 'src/dtos';
import { Helpers } from 'src/helpers';
import { UserService } from 'src/services/user/user.service';
import { Status, UserRole } from '../../../enums/enums';
import { UserUpdateDto } from '../../../dtos/user.dto';
import { CryptoService } from '../../../services/crypto/crypto.service';
import { AppGuard } from '../../../services/auth/app.guard';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cryptoService: CryptoService,
  ) {}

  @Get('/docs')
  @Redirect('https://documenter.getpostman.com/view/10509620/VUqpsx5F')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

  @Post('/')
  async createUser(@Body() requestDto: UserDto): Promise<Response> {
    try {
      const existingUser = await this.userService.existByPhoneOrEmail(
        requestDto.phone,
        requestDto.email,
      );
      if (existingUser)
        return Helpers.error('Business already exist', 'BAD_REQUEST');

      //encrypt password
      const hash = await this.cryptoService.encrypt(requestDto.password);
      requestDto.password = hash;

      const request = {
        ...requestDto,
        status: Status.INACTIVE,
        role: UserRole.BUSINESS,
        businessId: requestDto??`BIS${Helpers.getUniqueId()}`,
      } as any;

      console.log('Creating user:', request);
      const res = await this.userService.createUser(request);
      if (res) return Helpers.success(res, 'User created successfully');

      return Helpers.error('Unable to create Business', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(AppGuard)
  @Put('/:businessId')
  async updateUser(
    @Body() requestDto: UserUpdateDto,
    @Param('businessId') businessId: string,
  ): Promise<Response> {
    try {
      if (requestDto && (requestDto.email || requestDto.phone)) {
        const existingUser = await this.userService.findByPhoneOrEmail(
          requestDto.phone,
          requestDto.email,
        );
        if (existingUser) {
          if (
            existingUser.email != requestDto.email &&
            existingUser.phone != requestDto.phone
          ) {
            return Helpers.error('Business already exist with ', 'BAD_REQUEST');
          }
        }
      }

      const request = requestDto as any;
      console.log('Updating user:', request);
      const res = await this.userService.updateUser(businessId, request);
      if (res) return Helpers.success(res, 'User updated successfully');

      return Helpers.error('Unable to create Business', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }

  @UseGuards(AppGuard)
  @Get('/:businessId')
  async getUser(@Param('businessId') businessId: string): Promise<Response> {
    try {
      const res = await this.userService.findByBusinessId(businessId);
      if (res) return Helpers.success(res, 'User Found');

      return Helpers.error('Invalid User businessId', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }
}
