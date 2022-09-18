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
import {
  UserUpdateDto,
  VerifyUserDto,
  ValidateUserDto,
} from '../../../dtos/user.dto';
import { AppGuard } from '../../../services/auth/app.guard';
import { ApiResponse } from '../../../dtos/ApiResponse.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/docs')
  @Redirect('https://documenter.getpostman.com/view/10509620/VUqpsx5F')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

  @Post('/')
  async createUser(@Body() requestDto: UserDto): Promise<ApiResponse> {
    try {
      return await this.userService.createUser(requestDto);
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }

  @Post('/validate')
  async validateUser(
    @Body() requestDto: ValidateUserDto,
  ): Promise<ApiResponse> {
    try {
      return await this.userService.validateUser(requestDto);
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }

  @Post('/verify')
  async verifyUser(@Body() requestDto: VerifyUserDto): Promise<ApiResponse> {
    try {
      return await this.userService.verifyUser(requestDto);
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(AppGuard)
  @Put('/:userId')
  async updateUser(
    @Body() requestDto: UserUpdateDto,
    @Param('userId') userId: string,
  ): Promise<ApiResponse> {
    try {
      return this.userService.updateUser(userId, requestDto);
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }

  @UseGuards(AppGuard)
  @Get('/:userId')
  async getUser(@Param('userId') userId: string): Promise<ApiResponse> {
    try {
      return await this.userService.findByUserId(userId);
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'BAD_REQUEST');
    }
  }
}
