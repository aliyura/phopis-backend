import {
  Body,
  Controller,
  Headers,
  HttpStatus,
  Put,
  Param,
  Get,
  Query,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { User } from 'src/schemas/user.schema';
import { UserService } from '../../../services/user/user.service';
import {
  TrackingRequestDto,
  TrackingStatusChangeDto,
} from '../../../dtos/tracking.dto';
import { TrackingService } from 'src/services/tracking/tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(
    private trackingService: TrackingService,
    private userService: UserService,
  ) {}

  @UseGuards(AppGuard)
  @Post('/request')
  async requestTracking(
    @Headers('Authorization') token: string,
    @Body() requestDto: TrackingRequestDto,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );
    const user = userResponse.data as User;

    const response = await this.trackingService.createTrackingRequest(
      user,
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Put('/request/status/:trackingId')
  async updateTrackingRequest(
    @Headers('Authorization') token: string,
    @Param('trackingId') trackingId: string,
    @Body() requestDto: TrackingStatusChangeDto,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );
    const user = userResponse.data as User;

    const response = await this.trackingService.updateTrackingRequest(
      user,
      trackingId,
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/request/list')
  async getMyProducts(
    @Query('page') page: number,
    @Query('status') status: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );
    const user = userResponse.data as User;

    const response = await this.trackingService.getMyTrackingRequests(
      page,
      user,
      status,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/request/search')
  async searchMyProducts(
    @Query('page') page: number,
    @Query('q') searchString: string,
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.authenticatedUserByToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );
    const user = userResponse.data as User;

    const response = await this.trackingService.searchMyTrackingRequest(
      page,
      user,
      searchString,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
