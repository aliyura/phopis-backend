import {
  Body,
  Controller,
  Get,
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
    try {
      return await this.resourceTypeService.createResourceType(requestDto);
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }
  // FInd Business Type
  @UseGuards(AppGuard)
  @Get('/:resourceType')
  async getBusinessType(
    @Param('resourceType') resourceType: any,
  ): Promise<ApiResponse> {
    try {
      return await this.resourceTypeService.findResourceType(resourceType);
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }
  // FInd Business Type
  @Get('/')
  async allResourceType(): Promise<ApiResponse> {
    try {
      return await this.resourceTypeService.allResourceType();
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }
}
