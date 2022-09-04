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
  ): Promise<Response> {
    try {
      // check if business exist
      const response = await this.businessTypeService.findBusinessType(
        requestDto.title,
      );

      // Business Already Exist
      if (response)
        return Helpers.error('Business Type Already Exist', 'BAD_REQUEST');

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
  async getusinessType(
    @Param('businessType') businessType: any,
  ): Promise<Response> {
    try {
      const response = await this.businessTypeService.findBusinessType(
        businessType,
      );
      // const response = await this.businessTypeService.allBusinessType();
      if (response) return Helpers.success(response, 'Successfully');

      return Helpers.error('No data found ', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }
}
