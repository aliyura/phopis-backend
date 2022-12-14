import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Query,
  Get,
  Headers,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AppGuard } from 'src/services/auth/app.guard';
import { SaleService } from '../../../services/sale/sale.service';
import { SaleDto, TransactionDto } from '../../../dtos/sale.dto';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { UserService } from '../../../services/user/user.service';
import { User } from 'src/schemas/user.schema';
import { FilterDto } from 'src/dtos/report-filter.dto';

@Controller('inventory/sale')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly userService: UserService,
  ) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createSale(
    @Body() requestDto: SaleDto,
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

    const response = await this.saleService.createSale(user, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse2(
      response.data,
      response.message,
      HttpStatus.BAD_REQUEST,
    );
  }

  @UseGuards(AppGuard)
  @Post('/transaction')
  async createTransaction(
    @Body() requestDto: TransactionDto,
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

    const response = await this.saleService.createTransaction(user, requestDto);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse2(
      response.data,
      response.message,
      HttpStatus.BAD_REQUEST,
    );
  }
  @UseGuards(AppGuard)
  @Get('/detail/:suid')
  async accountInquiry(@Param('suid') suid: string): Promise<ApiResponse> {
    const saleResponse = await this.saleService.findById(suid);

    if (saleResponse.success) return saleResponse;

    return Helpers.failedHttpResponse(
      saleResponse.message,
      HttpStatus.NOT_FOUND,
    );
  }

  @UseGuards(AppGuard)
  @Get('/list')
  async getMySales(
    @Query('type') type: string,
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

    const response = await this.saleService.getMySales(
      filterDto,
      page,
      user,
      type,
      status,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }

  @UseGuards(AppGuard)
  @Get('/search')
  async searchMySales(
    @Query('type') type: string,
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
    const response = await this.saleService.searchMySales(
      filterDto,
      page,
      user,
      type,
      searchString,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
