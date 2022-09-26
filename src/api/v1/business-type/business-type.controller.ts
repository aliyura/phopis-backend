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
      const response = await this.businessTypeService.createBusinessType(
        requestDto,
      );
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
  // FInd Business Type
  @UseGuards(AppGuard)
  @Get('/:businessType')
  async getBusinessType(
    @Param('businessType') businessType: any,
  ): Promise<ApiResponse> {
    try {
      const response = await this.businessTypeService.findBusinessType(
        businessType,
      );
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
  // FInd Business Type
  // @UseGuards(AppGuard)
  @Get('/')
  async allBusinessType(): Promise<ApiResponse> {
    try {
      const response = await this.businessTypeService.allBusinessType();
      if (response.success) {
        return response;
      }
      return Helpers.failedHttpResponse(
        response.message,
        HttpStatus.BAD_REQUEST,
      );
    } catch (ex) {
      console.log('An error occurred:', ex);
      return Helpers.failedHttpResponse(
        'Something went wrong',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
}
