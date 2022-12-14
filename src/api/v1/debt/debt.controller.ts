import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Headers,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { DebtService } from 'src/services/debt/debt.service';
import {
  DebtDto,
  DebtRepaymentDto,
  UpdateDebtDto,
} from '../../../dtos/debt.dto';
import { User } from '../../../schemas/user.schema';
import { UserService } from '../../../services/user/user.service';
import { FilterDto } from '../../../dtos/report-filter.dto';

@Controller('debt')
export class DebtController {
  constructor(
    private readonly debtService: DebtService,
    private userService: UserService,
  ) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createDebt(
    @Body() requestDto: DebtDto,
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

    if (user.subscription && user.subscription !== undefined)
      if (!Helpers.verifySubscription(user.subscription.endDate))
        return Helpers.failedHttpResponse(
          `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
          HttpStatus.UNAUTHORIZED,
        );

    const response = await this.debtService.createDebt(user, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Put('/:id')
  async updateDebt(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
    @Body() requestDto: UpdateDebtDto,
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

    const response = await this.debtService.updateDebt(id, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Post('/repayment')
  async repayDebt(
    @Headers('Authorization') token: string,
    @Body() requestDto: DebtRepaymentDto,
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

    const response = await this.debtService.debtRepayment(user, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Delete('/:id')
  async deleteDebt(
    @Param('id') id: string,
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

    if (user.subscription && user.subscription !== undefined)
      if (!Helpers.verifySubscription(user.subscription.endDate))
        return Helpers.failedHttpResponse(
          `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
          HttpStatus.UNAUTHORIZED,
        );

    const response = await this.debtService.deleteDebt(id);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/list')
  async getMyProducts(
    @Query('page') page: number,
    @Query('status') status: string,
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

    const filterDto = { from, to } as FilterDto;

    const response = await this.debtService.getDebts(
      filterDto,
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
  async searchDebts(
    @Query('page') page: number,
    @Query('q') searchString: string,
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

    const filterDto = { from, to } as FilterDto;

    const response = await this.debtService.searchDebts(
      filterDto,
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
