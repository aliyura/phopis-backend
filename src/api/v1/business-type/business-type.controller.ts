import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { BusinessTypeService } from '../../../services/business-type/business-type.service';
import { BusinessTypeDto } from '../../../dtos/business-type.dto';
import { Helpers } from '../../../helpers/utitlity.helpers';
import { AppGuard } from '../../../services/auth/app.guard';
import { ApiResponse } from '../../../dtos/ApiResponse.dto';

@Controller('business-type')
export class BusinessTypeController {
  constructor(private readonly businessTypeService: BusinessTypeService) {}

  @Get('/docs')
  @Redirect('https://documenter.getpostman.com/view/10509620/VUqpsx5F')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

  @UseGuards(AppGuard)
  @Post('/')
  async createBusinessType(
    @Body() requestDto: BusinessTypeDto,
  ): Promise<ApiResponse> {
    try {
      // Not Exist, Create New
      const newResponse = await this.businessTypeService.createBusinessType(
        requestDto,
      );
      if (newResponse)
        return Helpers.success(
          newResponse,
          'Business type created successfully',
        );

      return Helpers.error('Authenticated successfully', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }
  // FInd Business Type
  @UseGuards(AppGuard)
  @Get('/:businessType')
  async getBusinessType(
    @Param('businessType') businessType: any,
  ): Promise<ApiResponse> {
    try {
      return await this.businessTypeService.findBusinessType(businessType);
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }
  // FInd Business Type
  // @UseGuards(AppGuard)
  @Get('/')
  async allBusinessType(): Promise<ApiResponse> {
    try {
      return await this.businessTypeService.allBusinessType();
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }
}
