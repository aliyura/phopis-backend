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
import { ResourceCategoryService } from 'src/services/resource-category/resource-category.service';
import { ResourceCategoryDto } from '../../../dtos/resource-category.dto';

@Controller('resource-category')
export class ResourceCategoryController {
  constructor(
    private readonly resourceCategoryService: ResourceCategoryService,
  ) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createResourceCategory(
    @Body() requestDto: ResourceCategoryDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.createResourceCategory(
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Put('/:id')
  async updateResourceCategory(
    @Param('id') id: string,
    @Body() requestDto: ResourceCategoryDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.updateResourceCategory(
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
  async deleteResourceCategory(@Param('id') id: string): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.deleteResourceCategory(
      id,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @Get('/list')
  async allResourceCategory(): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.allResourceCategory();
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
}
