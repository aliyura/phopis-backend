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
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { ProductTypeService } from 'src/services/product-type/product-type.service';
import { ProductTypeDto } from '../../../dtos/product-type.dto';
import { User } from '../../../schemas/user.schema';
import { UserService } from '../../../services/user/user.service';

@Controller('product-type')
export class ProductTypeController {
  constructor(
    private readonly resourceCategoryService: ProductTypeService,
    private userService: UserService,
  ) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createProductType(
    @Body() requestDto: ProductTypeDto,
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

    if (!Helpers.verifySubscription(user.subscription.endDate))
      return Helpers.failedHttpResponse(
        `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
        HttpStatus.UNAUTHORIZED,
      );

    const response = await this.resourceCategoryService.createProductType(
      user,
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Put('/:id')
  async updateProductType(
    @Param('id') id: string,
    @Headers('Authorization') token: string,
    @Body() requestDto: ProductTypeDto,
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

    if (!Helpers.verifySubscription(user.subscription.endDate))
      return Helpers.failedHttpResponse(
        `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
        HttpStatus.UNAUTHORIZED,
      );

    const response = await this.resourceCategoryService.updateProductType(
      id,
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Delete('/:id')
  async deleteProductType(
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

    if (!Helpers.verifySubscription(user.subscription.endDate))
      return Helpers.failedHttpResponse(
        `Your subscription expired on ${user.subscription.endDate}, you need to renew`,
        HttpStatus.UNAUTHORIZED,
      );

    const response = await this.resourceCategoryService.deleteProductType(id);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @Get('/list')
  async allProductType(
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

    const response = await this.resourceCategoryService.allProductType(user);
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
