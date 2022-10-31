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

@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AppGuard)
  @Get('/wallet/analytics')
  async getWalletTotalCredit(
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.findByUserToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    const user = userResponse.data as User;
    const response = await this.reportService.getWalletAnalytics(
      user.walletAddress,
    );
    if (response.success) {
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
    const userResponse = await this.userService.findByUserToken(authToken);
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
}
