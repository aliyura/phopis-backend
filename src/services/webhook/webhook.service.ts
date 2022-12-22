import { Injectable } from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Webhook, WebhookDocument } from '../../schemas/webhook.schema';
import { Helpers } from '../../helpers/utitlity.helpers';
import { Status } from '../../enums/enums';

@Injectable()
export class WebhookService {
  constructor(
    @InjectModel(Webhook.name) private webhook: Model<WebhookDocument>,
  ) {}

  async saveWebhook(webhook: any): Promise<ApiResponse> {
    try {
      console.log('saving webhook request');
      const request = {
        requestId: `req${Helpers.getUniqueId()}`,
        payload: webhook,
        status: Status.PENDING,
      };
      const webhookResponse = await (await this.webhook.create(request)).save();
      return Helpers.success(webhookResponse);
    } catch (ex) {
      console.log(ex);
      Helpers.fail('Unable to save webhook');
    }
  }

  async updateWebhookStatus(
    requestId: string,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const request = {
        status: status,
      };
      const saved = await this.webhook.updateOne(
        { requestId },
        { $set: request },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(ex);
      Helpers.fail('Unable to update webhook');
    }
  }
}
