import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { UnitService } from '../../../services/unit/unit.service';
import { UserService } from 'src/services/user/user.service';
import { User } from '../../../schemas/user.schema';
import {
  UnitTransferDto,
  BuyUnitDto,
  WithdrawalRequestDto,
  WithdrawalStatusDto,
} from '../../../dtos/unit.dto';
import { LogsService } from '../../../services/logs/logs.service';
import { WebhookService } from '../../../services/webhook/webhook.service';
import { Status } from '../../../enums/enums';

@Controller('unit')
export class UnitController {
  constructor(
    private unitService: UnitService,
    private webhookService: WebhookService,
    private logService: LogsService,
    private userService: UserService,
  ) {}

  @Post('/webhook')
  async addUnit(
    @Body() webhook: any,
    @Headers() headers,
  ): Promise<ApiResponse> {
    console.log('webhook', webhook);
    console.log('headers', headers);

    const webhookRes = await this.webhookService.saveWebhook(webhook);
    if (webhook && webhook.status) {
      const buyUnitDto = webhook as BuyUnitDto;
      const response = await this.unitService.buyUnit(buyUnitDto);
      if (response.success) {
        await this.webhookService.updateWebhookStatus(
          webhookRes.data.requestId,
          Status.SUCCESSFUL,
        );
      } else {
        await this.webhookService.updateWebhookStatus(
          webhookRes.data.requestId,
          Status.FAILED,
        );
      }
      return response;
    } else {
      console.log('Failed transaction');
      await this.webhookService.updateWebhookStatus(
        webhookRes.data.requestId,
        Status.FAILED,
      );
      return Helpers.failedHttpResponse(
        'Unable to validate transaction',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AppGuard)
  @Post('/transfer')
  async transferUnits(
    @Headers('Authorization') token: string,
    @Body() fundTransferDto: UnitTransferDto,
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

    const currentUser = userResponse.data as User;
    const response = await this.unitService.fundsTransfer(
      currentUser.unitAddress,
      fundTransferDto,
    );
    if (response.success) return response;

    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Post('/withdraw')
  async withdrawUnits(
    @Headers('Authorization') token: string,
    @Body() requestDto: WithdrawalRequestDto,
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

    const currentUser = userResponse.data as User;
    const response = await this.unitService.withdrawUnits(
      currentUser.unitAddress,
      requestDto,
    );
    if (response.success) return response;

    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Put('/withdrawal/status')
  async updateWithdrawalStatus(
    @Headers('Authorization') token: string,
    @Body() requestDto: WithdrawalStatusDto,
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

    const response = await this.unitService.updateWithdrawalStatus(requestDto);
    if (response.success) return response;

    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/')
  async getUnit(@Headers('Authorization') token: string): Promise<ApiResponse> {
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

    const response = await this.unitService.findUnitByAddress(user.unitAddress);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
  @UseGuards(AppGuard)
  @Get('/logs')
  async getUnitLogs(
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
    const response = await this.logService.getUnitLog(user.unitAddress);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/withdrawal/requests')
  async getUnitWithdrawals(
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
    const response = await this.unitService.getWithdrawalRequests(
      user.businessId || user.uuid,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
