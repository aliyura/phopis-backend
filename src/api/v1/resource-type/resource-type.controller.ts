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
import { ResourceTypeService } from 'src/services/resource-type/resource-type.service';
import { ResourceTypeDto } from '../../../dtos/resource-type.dto';

@Controller('resource-type')
export class ResourceTypeController {
  constructor(private readonly resourceCategoryService: ResourceTypeService) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createResourceType(
    @Body() requestDto: ResourceTypeDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.createResourceType(
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @UseGuards(AppGuard)
  @Put('/:id')
  async updateResourceType(
    @Param('id') id: string,
    @Body() requestDto: ResourceTypeDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.updateResourceType(
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
  async deleteResourceType(@Param('id') id: string): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.deleteResourceType(id);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  @Get('/list')
  async allResourceType(): Promise<ApiResponse> {
    const response = await this.resourceCategoryService.allResourceType();
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
