import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiResponse } from '../../dtos/ApiResponse.dto';
import axios from 'axios';
import { Helpers } from 'src/helpers';
import { Messages } from 'src/utils/messages/messages';
import * as https from 'https';

@Injectable()
export class VerificationService {
  async verifyNIN(nin: string): Promise<ApiResponse> {
    try {
      if (!nin) return Helpers.fail('User NIN required');

      const apiKey = process.env.NIN_API_KEY;
      const baseURL = process.env.NIN_BASEURL;

      const req = `${baseURL}/vnin?key=${apiKey}&pickNIN=${nin}`;
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      }); //disable certificate error

      console.log('NIN Verification request:', req);
      const response = await axios.get(req, { httpsAgent });
      console.log('response:', response.data);
      if (
        response.status == HttpStatus.OK &&
        response.data.response !== 'norecord'
      )
        return Helpers.success(response.data);

      return Helpers.fail('NIN Verification failed');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
