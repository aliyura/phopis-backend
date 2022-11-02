import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Headers,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Helpers } from 'src/helpers';
import { UserService } from 'src/services/user/user.service';

import { AppGuard } from '../../../services/auth/app.guard';
import { ApiResponse } from '../../../dtos/ApiResponse.dto';
import { UserRole } from '../../../enums/enums';
import { Messages } from '../../../utils/messages/messages';
import { UserBranchDto } from 'src/dtos';

@Controller('branch')
export class BranchController {
  constructor(private userService: UserService) {}

  @UseGuards(AppGuard)
  @Post('/add')
  async createBusinessUser(
    @Headers('Authorization') token: string,
    @Body() requestDto: UserBranchDto,
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

    if (!Helpers.verifySubscription(user.subscription.endDate))
      return Helpers.failedHttpResponse(
        `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
        HttpStatus.UNAUTHORIZED,
      );

    const response = await this.userService.createUserBranch(user, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/list')
  async getAllBranches(
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
      const users = await this.userService.findAllUserBranches(
        user,
        page,
        status,
      );
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
  async searchBranches(
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
      const users = await this.userService.searchUserBranches(
        user,
        page,
        searchText,
      );
      if (users.success) return users;
      return Helpers.failedHttpResponse(users.message, HttpStatus.NOT_FOUND);
    } else {
      return Helpers.failedHttpResponse(
        Messages.NoPermission,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
