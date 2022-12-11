import { Injectable, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Messages } from 'src/utils/messages/messages';
import { Helpers } from '../../helpers/utitlity.helpers';

@Injectable()
export class SmsService {
  async sendMessage(recipient: string, message): Promise<ApiResponse> {
    try {
      if (recipient.startsWith('0')) recipient = '234' + recipient.substring(1);
      console.log('Sending sms to ' + recipient);

      const apiKey = process.env.SMS_APIKEY;
      const baseURL = process.env.SMS_BASEURL;
      const appName = process.env.APP_NAME;

      const req = `${baseURL}?api_token=${apiKey}&from=${appName}&to=${recipient}&body=${message}&dnd=2`;
      console.log('SMS request:', req);
      const response = await axios.get(req);
      console.log(response.data);
      if (response.status == HttpStatus.OK)
        return Helpers.success(response.data);

      return Helpers.fail('Unable to send SMS');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
