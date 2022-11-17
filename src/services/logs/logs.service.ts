import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { WalletLog } from 'src/schemas/wallet-logs.schema';
import { WalletLogDocument } from '../../schemas/wallet-logs.schema';
import { WalletLogDto } from '../../dtos/wallet.dto';
import { Helpers } from 'src/helpers';
import { Messages } from 'src/utils/messages/messages';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(WalletLog.name) private walletLog: Model<WalletLogDocument>,
  ) {}

  async saveWalletLog(walletLog: WalletLogDto): Promise<ApiResponse> {
    try {
      const request = {
        ...walletLog,
      } as any;

      const createdWallet = await (await this.walletLog.create(request)).save();
      return Helpers.success(createdWallet);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getWalletLog(address: string): Promise<ApiResponse> {
    try {
      const walletLogs = await this.walletLog.find({ address }).exec();
      if (walletLogs) return Helpers.success(walletLogs);
      return Helpers.fail('No wallet found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
