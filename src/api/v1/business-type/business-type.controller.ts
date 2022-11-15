import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
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

  @UseGuards(AppGuard)
  @Post('/')
  async createBusinessType(
    @Body() requestDto: BusinessTypeDto,
  ): Promise<ApiResponse> {
    const response = await this.businessTypeService.createBusinessType(
      requestDto,
    );
    if (response.success) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.BAD_REQUEST);
  }

  @Get('/list')
  async allBusinessType(): Promise<ApiResponse> {
    const response = await this.businessTypeService.allBusinessType();
    if (response.success && response.data) {
      return response;
    }
    return Helpers.failedHttpResponse(response.message, HttpStatus.NOT_FOUND);
  }
}
