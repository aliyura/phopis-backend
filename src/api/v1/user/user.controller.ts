import {
  Body,
  Controller,
  Get,
  HttpStatus,
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
    const response = await this.userService.createUser(requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @Post('/validate')
  async validateUser(
    @Body() requestDto: ValidateUserDto,
  ): Promise<ApiResponse> {
    const response = await this.userService.validateUser(requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @Post('/verify')
  async verifyUser(@Body() requestDto: VerifyUserDto): Promise<ApiResponse> {
    const response = await this.userService.verifyUser(requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Put('/:userId')
  async updateUser(
    @Body() requestDto: UserUpdateDto,
    @Param('userId') userId: string,
  ): Promise<ApiResponse> {
    const response = await this.userService.updateUser(userId, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/:userId')
  async getUser(@Param('userId') userId: string): Promise<ApiResponse> {
    const response = await this.userService.findByUserId(userId);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
}
