import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { User } from 'src/schemas/user.schema';
import { ReportService } from '../../../services/report/report.service';
import { FilterDto } from '../../../dtos/report-filter.dto';
import { UserService } from '../../../services/user/user.service';
import { DebtService } from '../../../services/debt/debt.service';

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly userService: UserService,
    private readonly debtService: DebtService,
  ) {}

  @UseGuards(AppGuard)
  @Get('/wallet/analytics')
  async getWalletTotalCredit(
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
    const response = await this.reportService.getWalletAnalytics(
      user.businessId || user.uuid,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/product/inventory')
  async getProductInventory(
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

    const response = await this.reportService.getProductInventory(user);
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/service/inventory')
  async getServiceInventory(
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

    const response = await this.reportService.getServicesInventory(user);
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/inventory/analytics')
  async getInventoryAnalytics(
    @Query('from') from: string,
    @Query('to') to: string,
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

    const requestDto = { from, to } as FilterDto;

    const response = await this.reportService.getInventoryAnalytics(
      user,
      requestDto,
    );
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/inventory/analytics/download')
  async downloadInventoryAnalytics(
    @Query('from') from: string,
    @Query('to') to: string,
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

    const requestDto = { from, to } as FilterDto;

    const response = await this.reportService.downloadInventoryAnalytics(
      user,
      requestDto,
    );
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/resource/analytics')
  async getResourceAnalytics(
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

    const response = await this.reportService.getResourceAnalytics(user);
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/debt/analytics')
  async debtAnalytics(
    @Query('from') from: string,
    @Query('to') to: string,
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
    const requestDto = { from, to } as FilterDto;

    const response = await this.reportService.getDebtAnalytics(
      requestDto,
      user,
    );
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
