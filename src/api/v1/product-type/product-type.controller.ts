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
import { ProductTypeService } from 'src/services/product-type/product-type.service';
import { ProductTypeDto } from '../../../dtos/product-type.dto';

@Controller('inventory/product-type')
export class ProductTypeController {
  constructor(private readonly resourceCategoryService: ProductTypeService) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createProductType(
    @Body() requestDto: ProductTypeDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.createProductType(
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
    @Body() requestDto: ProductTypeDto,
  ): Promise<ApiResponse> {
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
  async deleteProductType(@Param('id') id: string): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.deleteProductType(id);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @Get('/list')
  async allProductType(): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.allProductType();
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
}
