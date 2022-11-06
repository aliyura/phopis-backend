import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiResponse } from '../../dtos/ApiResponse.dto';
import axios from 'axios';
import { Helpers } from 'src/helpers';
import { Messages } from 'src/utils/messages/messages';
import * as https from 'https';
import * as Flutterwave from 'flutterwave-node-v3';

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

      const response = await axios.get(req, { httpsAgent });
      if (
        response.status == HttpStatus.OK &&
        response.data.response !== 'norecord' &&
        response.data.firstname
      )
        return Helpers.success(response.data);

      return Helpers.fail('NIN Verification failed');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async verifyTransaction(
    transactionId: number,
    expectedAmount: number,
  ): Promise<ApiResponse> {
    try {
      if (!transactionId) return Helpers.fail('Transaction id required');

      const flw = new Flutterwave(
        process.env.FLW_PUBLIC_KEY,
        process.env.FLW_SECRET_KEY,
      );
      const response = await flw.Transaction.verify({ id: transactionId });
      console.log('Flutterwave transaction verification:', response);
      if (
        response.data &&
        response.data.status === 'successful' &&
        response.data.amount === expectedAmount
      ) {
        return Helpers.success(response.data);
      } else {
        return Helpers.fail('Invalid transaction id');
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
