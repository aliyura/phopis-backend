import { Body, Controller, Headers, HttpStatus, Post } from '@nestjs/common';
import { UnitService } from 'src/services/unit/unit.service';
import { WebhookService } from 'src/services/webhook/webhook.service';
import { ApiResponse } from '../../../dtos/ApiResponse.dto';
import { Status } from '../../../enums/enums';
import { Helpers } from '../../../helpers/utitlity.helpers';
import { BuyUnitDto } from '../../../dtos/unit.dto';

@Controller('webhook')
export class WebhookController {
  constructor(
    private unitService: UnitService,
    private webhookService: WebhookService,
  ) {}

  @Post('/')
  async addUnit(
    @Body() webhook: any,
    @Headers() headers,
  ): Promise<ApiResponse> {
    console.log('webhook', webhook);
    console.log('headers', headers);

    const webhookRes = await this.webhookService.saveWebhook(webhook);
    if (webhook && webhook.status) {
      const buyUnitDto = webhook as BuyUnitDto;
      const response = await this.unitService.buyUnit(buyUnitDto);
      if (response.success) {
        await this.webhookService.updateWebhookStatus(
          webhookRes.data.requestId,
          Status.SUCCESSFUL,
        );
      } else {
        await this.webhookService.updateWebhookStatus(
          webhookRes.data.requestId,
          Status.FAILED,
        );
      }
      return response;
    } else {
      console.log('Failed transaction');
      await this.webhookService.updateWebhookStatus(
        webhookRes.data.requestId,
        Status.FAILED,
      );
      return Helpers.failedHttpResponse(
        'Unable to validate transaction',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
