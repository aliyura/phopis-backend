import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Redirect,
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

  @Get('/docs')
  @Redirect('https://documenter.getpostman.com/view/10509620/VUqpsx5F')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

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
