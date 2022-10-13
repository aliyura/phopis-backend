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
  constructor(private readonly resourceTypeService: ResourceTypeService) {}
  @UseGuards(AppGuard)
  @Post('/')
  async createResourceType(
    @Body() requestDto: ResourceTypeDto,
  ): Promise<ApiResponse> {
    const response = await this.resourceTypeService.createResourceType(
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
    const response = await this.resourceTypeService.updateResourceType(
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
    const response = await this.resourceTypeService.deleteResourceType(id);
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  // FInd Business Type
  @UseGuards(AppGuard)
  @Get('/:resourceType')
  async getBusinessType(
    @Param('resourceType') resourceType: any,
  ): Promise<ApiResponse> {
    const response = await this.resourceTypeService.findResourceType(
      resourceType,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
  // FInd Business Type
  @Get('/')
  async allResourceType(): Promise<ApiResponse> {
    const response = await this.resourceTypeService.allResourceType();
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }
}
