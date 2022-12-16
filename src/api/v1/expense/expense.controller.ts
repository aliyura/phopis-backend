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
import { ExpenseService } from 'src/services/expense/expense.service';
import { ExpenseDto, UpdateExpenseDto } from '../../../dtos/expense.dto';
import { User } from '../../../schemas/user.schema';
import { UserService } from '../../../services/user/user.service';
import { FilterDto } from '../../../dtos/report-filter.dto';

@Controller('expense')
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private userService: UserService,
  ) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createExpense(
    @Body() requestDto: ExpenseDto,
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

    const response = await this.expenseService.createExpense(user, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Put('/:id')
  async updateExpense(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
    @Body() requestDto: UpdateExpenseDto,
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

    const response = await this.expenseService.updateExpense(id, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Delete('/:id')
  async deleteExpense(
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

    const response = await this.expenseService.deleteExpense(id);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @UseGuards(AppGuard)
  @Get('/list')
  async getMyProducts(
    @Query('page') page: number,
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

    const response = await this.expenseService.getExpenses(
      filterDto,
      page,
      user,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/search')
  async searchExpenses(
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

    const response = await this.expenseService.searchExpenses(
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
