import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from '../../../helpers/utitlity.helpers';

@Controller()
export class AppController {
  @Get('/docs')
  @Redirect('https://documenter.getpostman.com/view/10509620/VUqpsx5F')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getDocs(): void {}

  @Get('/ping')
  async ping(): Promise<ApiResponse> {
    return Helpers.success('Phopis Service is up and running...');
  }
}
