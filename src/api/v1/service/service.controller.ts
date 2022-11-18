import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { ServiceService } from '../../../services/service/service.service';
import { ServiceDto, UpdateServiceDto } from '../../../dtos/service.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { User } from 'src/schemas/user.schema';
import { UserService } from '../../../services/user/user.service';

@Controller('inventory/service')
export class ServiceController {
  constructor(
    private serviceService: ServiceService,
    private userService: UserService,
  ) {}

  @UseGuards(AppGuard)
  @Post('/')
  async createService(
    @Headers('Authorization') token: string,
    @Body() requestDto: ServiceDto,
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
    const user = userResponse.data as User;

        if (user.subscription && user.subscription !== undefined)
      if (!Helpers.verifySubscription(user.subscription.endDate))
      return Helpers.failedHttpResponse(
        `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
        HttpStatus.UNAUTHORIZED,
      );

    const response = await this.serviceService.createService(user, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Put('/:serviceId')
  async updateService(
    @Headers('Authorization') token: string,
    @Param('serviceId') serviceId: string,
    @Body() requestDto: UpdateServiceDto,
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
    const user = userResponse.data as User;

        if (user.subscription && user.subscription !== undefined)
      if (!Helpers.verifySubscription(user.subscription.endDate))
      return Helpers.failedHttpResponse(
        `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
        HttpStatus.UNAUTHORIZED,
      );

    const response = await this.serviceService.updateService(
      user,
      serviceId,
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Delete('/:serviceId')
  async deleteService(
    @Headers('Authorization') token: string,
    @Param('serviceId') serviceId: string,
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
    const user = userResponse.data as User;

        if (user.subscription && user.subscription !== undefined)
      if (!Helpers.verifySubscription(user.subscription.endDate))
      return Helpers.failedHttpResponse(
        `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
        HttpStatus.UNAUTHORIZED,
      );

    const response = await this.serviceService.deleteService(user, serviceId);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/list')
  async getMyServices(
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
    const user = userResponse.data as User;

    const response = await this.serviceService.getMyServices(
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
  @Get('/search')
  async searchMyServices(
    @Query('page') page: number,
    @Query('q') searchString: string,
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
    const user = userResponse.data as User;

    const response = await this.serviceService.searchMyServices(
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
