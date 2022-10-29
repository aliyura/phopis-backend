import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { AppGuard } from 'src/services/auth/app.guard';
import { SaleService } from '../../../services/sale/sale.service';
import { SaleDto } from '../../../dtos/sale.dto';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { UserService } from '../../../services/user/user.service';
import { User } from 'src/schemas/user.schema';

@Controller('inventory/sale')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly userService: UserService,
  ) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createProductSize(
    @Body() requestDto: SaleDto,
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
}
