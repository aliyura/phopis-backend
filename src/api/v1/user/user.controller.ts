import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Headers,
  Post,
  Put,
  UseGuards,
  Query,
  Param,
  Delete,
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
import { ResetPasswordDto, BusinessUserDto } from '../../../dtos/user.dto';
import { UserRole } from '../../../enums/enums';
import { Messages } from '../../../utils/messages/messages';
import { AdditionalInfoRequest } from '../../../dtos/additional-info-request.dto';

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

  @Post('/password-reset')
  async resetPassword(
    @Body() requestDto: ResetPasswordDto,
  ): Promise<ApiResponse> {
    const response = await this.userService.resetPassword(requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Post('/add')
  async createBusinessUser(
    @Headers('Authorization') token: string,
    @Body() requestDto: BusinessUserDto,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    if (user.subscription && user.subscription !== undefined)
      if (!Helpers.verifySubscription(user.subscription.endDate))
        return Helpers.failedHttpResponse(
          `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
          HttpStatus.UNAUTHORIZED,
        );

    const response = await this.userService.createBusinessUser(
      user,
      requestDto,
    );
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
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.updateUser(
      user,
      userId,
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Post('/create/pin/:pin')
  async createPIN(
    @Param('pin') pin: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.createPIN(user, pin);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Post('/verify/pin/:pin')
  async verifyPIN(
    @Param('pin') pin: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.verifyPIN(user, pin);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Put('/activate/:userId')
  async activateUser(
    @Param('userId') userId: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.activateUser(user, userId);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Delete('/:userId')
  async deleteUser(
    @Param('userId') userId: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.deleteUser(user, userId);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Put('/deactivate/:userId')
  async deactivateUser(
    @Param('userId') userId: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.deactivateUser(user, userId);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @Post('/additional/information')
  async addAdditionalInfo(
    @Body() requestDto: AdditionalInfoRequest,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.addAdditionalInfo(user, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @Put('/additional/information')
  async deleteAdditionalInfo(
    @Body() requestDto: AdditionalInfoRequest,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (!userResponse.success) return Helpers.fail(userResponse.message);
    const user = userResponse.data;

    const response = await this.userService.deleteAdditionalInfo(
      user,
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Get('/')
  async getUser(@Headers('Authorization') token: string): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    if (userResponse.success) return userResponse;

    return Helpers.failedHttpResponse(
      userResponse.message,
      HttpStatus.NOT_FOUND,
    );
  }

  @UseGuards(AppGuard)
  @Get('/inquiry/:code')
  async accountInquiry(@Param('code') code: number): Promise<ApiResponse> {
    const userResponse = await this.userService.findByUserCode(code);

    if (userResponse.success) return userResponse;

    return Helpers.failedHttpResponse(
      userResponse.message,
      HttpStatus.NOT_FOUND,
    );
  }

  @Get('/business/retrieve/:alias')
  async findUserByAlias(@Param('alias') alias: string): Promise<ApiResponse> {
    const userResponse = await this.userService.findByAlias(alias);
    if (userResponse.success) return userResponse;

    return Helpers.failedHttpResponse(
      userResponse.message,
      HttpStatus.NOT_FOUND,
    );
  }

  @UseGuards(AppGuard)
  @Get('/list')
  async getAllUsers(
    @Query('page') page: number,
    @Query('status') status: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    const user = userResponse.data;

    if (user.role === UserRole.BUSINESS || user.role === UserRole.ADMIN) {
      const users = await this.userService.findAllUsers(user, page, status);
      if (users.success) return users;
      return Helpers.failedHttpResponse(users.message, HttpStatus.NOT_FOUND);
    } else {
      return Helpers.failedHttpResponse(
        Messages.NoPermission,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @UseGuards(AppGuard)
  @Get('/search')
  async searchUsers(
    @Query('page') page: number,
    @Query('q') searchText: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(
      authToken,
    );
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    const user = userResponse.data;

    if (user.role === UserRole.BUSINESS || user.role === UserRole.ADMIN) {
      const users = await this.userService.searchUsers(user, page, searchText);
      if (users.success) return users;
      return Helpers.failedHttpResponse(users.message, HttpStatus.NOT_FOUND);
    } else {
      return Helpers.failedHttpResponse(
        Messages.NoPermission,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
  @Get('/business/search')
  async searchBusiness(
    @Query('page') page: number,
    @Query('q') searchText: string,
  ): Promise<ApiResponse> {
    const users = await this.userService.searchBusiness(page, searchText);
    if (users.success) return users;
    return Helpers.failedHttpResponse(users.message, HttpStatus.NOT_FOUND);
  }
}
