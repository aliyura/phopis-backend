import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { WalletService } from '../../../services/wallet/wallet.service';
import { UserService } from 'src/services/user/user.service';
import { User } from '../../../schemas/user.schema';
import { FundsTransferDto, FundWalletDto } from '../../../dtos/wallet.dto';
import { LogsService } from '../../../services/logs/logs.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private logService: LogsService,
    private userService: UserService,
  ) {}

  @UseGuards(AppGuard)
  @Post('/')
  async fundWallet(
    @Headers('Authorization') token: string,
    @Body() fundWalletDto: FundWalletDto,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.findByUserToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.BAD_REQUEST,
      );

    const currentUser = userResponse.data as User;
    const response = await this.walletService.fundWallet(
      currentUser.walletAddress,
      fundWalletDto,
    );
    if (response.success) return response;

    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Post('/transfer')
  async transferFunds(
    @Headers('Authorization') token: string,
    @Body() fundTransferDto: FundsTransferDto,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.findByUserToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.UNAUTHORIZED,
      );

    const currentUser = userResponse.data as User;
    const response = await this.walletService.fundsTransfer(
      currentUser.walletAddress,
      fundTransferDto,
    );
    if (response.success) return response;

    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/')
  async getWallet(
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.findByUserToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.BAD_REQUEST,
      );

    const user = userResponse.data as User;
    const response = await this.walletService.findWalletByAddress(
      user.walletAddress,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Get('/logs')
  async getWalletLogs(
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.findByUserToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.BAD_REQUEST,
      );

    const user = userResponse.data as User;
    const response = await this.logService.getWalletLog(user.walletAddress);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/analytics')
  async getWalletTotalCredit(
    @Headers('Authorization') token: string,
  ): Promise<ApiResponse> {
    const authToken = token.substring(7);
    const userResponse = await this.userService.findByUserToken(authToken);
    if (!userResponse.success)
      return Helpers.failedHttpResponse(
        userResponse.message,
        HttpStatus.BAD_REQUEST,
      );

    const user = userResponse.data as User;
    const response = await this.logService.getWalletAnalytics(
      user.walletAddress,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
}
