import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Headers,
  Post,
  Put,
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
  @Put('/')
  async updateUser(
    @Body() requestDto: UserUpdateDto,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.findByUserToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.updateUser(user.uuid, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/')
  async getUser(@Headers('Authorization') token: string): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.findByUserToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (userResponse.success) return userResponse;

    return Helpers.failedHttpResponse(
      userResponse.message,
      HttpStatus.BAD_REQUEST,
    );
  }
}
