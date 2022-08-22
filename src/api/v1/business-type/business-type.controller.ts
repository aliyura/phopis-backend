import {
  Body,
  Controller,
  Get,
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
      const response = await this.businessTypeService.createBusinessType(
        requestDto,
      );
      if (response)
        return Helpers.success(response, 'Business type created successfully');

      return Helpers.error('Authenticated successfully', 'BAD_REQUEST');
    } catch (e) {
      const { message } = e;
      console.log(message);
      return Helpers.error(message, 'INTERNAL_SERVER_ERROR');
    }
  }
}
