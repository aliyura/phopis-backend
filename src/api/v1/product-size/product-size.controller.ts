import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { AppGuard } from 'src/services/auth/app.guard';
import { ProductSizeDto } from '../../../dtos/product-size.dto';
import { ProductSizeService } from 'src/services/product-size/product-size.service';

@Controller('product-size')
export class ProductSizeController {
  constructor(private readonly resourceCategoryService: ProductSizeService) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createProductSize(
    @Body() requestDto: ProductSizeDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.createProductSize(
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Put('/:id')
  async updateProductSize(
    @Param('id') id: string,
    @Body() requestDto: ProductSizeDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.updateProductSize(
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
  async deleteProductSize(@Param('id') id: string): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.deleteProductSize(id);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @Get('/list')
  async allProductSize(): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.allProductSize();
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
