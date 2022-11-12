import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Headers,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { ProductCategoryService } from 'src/services/product-category/product-category.service';
import { ProductCategoryDto } from '../../../dtos/product-category.dto';
import { User } from '../../../schemas/user.schema';
import { UserService } from '../../../services/user/user.service';

@Controller('product-category')
export class ProductCategoryController {
  constructor(
    private readonly resourceCategoryService: ProductCategoryService,
    private readonly userService: UserService,
  ) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createProductCategory(
    @Body() requestDto: ProductCategoryDto,
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

    const response = await this.resourceCategoryService.createProductCategory(
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
  async updateProductCategory(
    @Param('id') id: string,
    @Body() requestDto: ProductCategoryDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.updateProductCategory(
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
  async deleteProductCategory(@Param('id') id: string): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.deleteProductCategory(
      id,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @Get('/list')
  async allProductCategory(): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.allProductCategory();
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
