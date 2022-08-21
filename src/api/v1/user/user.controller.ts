import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Redirect,
} from '@nestjs/common';
import { UserDto } from 'src/dtos';
import { Helpers } from 'src/helpers';
import { UserService } from 'src/services/user/user.service';
import { UserStatus, UserRole } from '../../../enums/enums';
import { UserUpdateDto } from '../../../dtos/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

      const request = {
        ...requestDto,
        status: UserStatus.INACTIVE,
        role: UserRole.BUSINESS,
        stamp: Helpers.getUniqueId(),
      } as any;

      console.log('Creating user:', request);
      const res = await this.userService.createUser(request);
      if (res) return Helpers.success(res, 'User created successfully');

      return Helpers.error('Unable to create Business', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }

  @Put('/:stamp')
  async updateUser(
    @Body() requestDto: UserUpdateDto,
    @Param('stamp') stamp: string,
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
      const res = await this.userService.updateUser(stamp, request);
      if (res) return Helpers.success(res, 'User updated successfully');

      return Helpers.error('Unable to create Business', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }

  @Get('/:stamp')
  async getUser(@Param('stamp') stamp: string): Promise<Response> {
    try {
      const res = await this.userService.findByStamp(stamp);
      if (res) return Helpers.success(res, 'User Found');

      return Helpers.error('Invalid User Stamp', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }
}
