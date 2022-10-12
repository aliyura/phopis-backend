import { Injectable } from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Wallet, WalletDocument } from '../../schemas/wallet.schema';
import { Helpers } from '../../helpers/utitlity.helpers';
import { Messages } from 'src/utils/messages/messages';
import { SmsService } from '../sms/sms.service';
import { Status } from 'src/enums';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { FundWalletDto, FundsTransferDto } from '../../dtos/wallet.dto';
import { WalletActivity } from '../../enums/enums';
import { LogsService } from '../logs/logs.service';
import { User, UserDocument } from '../../schemas/user.schema';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private wallet: Model<WalletDocument>,
    @InjectModel(User.name) private user: Model<UserDocument>,
    private readonly logService: LogsService,
    private readonly smsService: SmsService,
    private verificationService: VerificationService,
  ) {}

  async createWallet(uuid: string, code: number): Promise<ApiResponse> {
    try {
      //create wallet
      if (!uuid) return Helpers.fail('Wallet user id required');

      //check if user already have wallet
      const alreadyExist = await this.existByUuid(uuid);
      if (alreadyExist) return Helpers.fail('User already have a wallet');

      const request = {
        uuid,
        userCode: code,
        address: Helpers.getUniqueId(),
        code: Helpers.getCode(),
        status: Status.ACTIVE,
        balance: 1000,
      } as any;

      const createdWallet = await (await this.wallet.create(request)).save();
      return Helpers.success(createdWallet);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async fundWallet(
    address: string,
    fundWalletDto: FundWalletDto,
  ): Promise<ApiResponse> {
    try {
      const wallet = await this.wallet.findOne({ address }).exec();
      if (!wallet) return Helpers.fail('Wallet not found');
      const user = await this.user.findOne({ uuid: wallet.uuid });
      if (!user) return Helpers.fail('User not found');

      //verify payment
      const result = await this.verificationService.verifyTransaction(
        fundWalletDto.paymentRef,
        fundWalletDto.amount,
      );
      if (!result.success) return Helpers.fail(result.message);

      const currentBalance = wallet.balance;
      let newBalance = currentBalance + fundWalletDto.amount;
      newBalance = Math.round(newBalance * 100) / 100; //two decimal

      const nData = {
        balance: newBalance,
        prevBalance: currentBalance,
      } as any;

      const walletLog = {
        activity: WalletActivity.CREDIT,
        status: Status.SUCCESSFUL,
        uuid: wallet.uuid,
        amount: fundWalletDto.amount,
        ref: fundWalletDto.paymentRef,
        channel: fundWalletDto.channel,
      } as any;

      await this.wallet.updateOne({ address }, nData);

      await this.logService.saveWalletLog(walletLog);

      //notification

      await this.smsService.sendMessage(
        user.phoneNumber,
        `Your wallet has been credited with ${Helpers.convertToMoney(
          fundWalletDto.amount,
        )} `,
      );
      const updatedWallet = await this.wallet.findOne({ address });
      return Helpers.success(updatedWallet);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async fundsTransfer(
    address: string,
    fundTransferDto: FundsTransferDto,
  ): Promise<ApiResponse> {
    try {
      const wallet = await this.wallet.findOne({ address }).exec();
      if (!wallet) return Helpers.fail('Wallet not found');
      const user = await this.user.findOne({ uuid: wallet.uuid });
      if (!user) return Helpers.fail('User not found');

      const recipientWallet = await this.wallet
        .findOne({ code: fundTransferDto.recipient })
        .exec();
      if (!recipientWallet) return Helpers.fail('Recipient Wallet not found');

      const senderBalance = wallet.balance;
      if (senderBalance < fundTransferDto.amount)
        return Helpers.fail('Insufficient funds');

      const recipientUser = await this.user.findOne({
        uuid: recipientWallet.uuid,
      });
      if (!recipientUser) return Helpers.fail('Recipient not found');

      const currentBalance = recipientWallet.balance;
      let recipientBalance = currentBalance + fundTransferDto.amount;
      let newSenderBalance = senderBalance - fundTransferDto.amount;

      newSenderBalance = Math.round(newSenderBalance * 100) / 100; //two decimal
      recipientBalance = Math.round(recipientBalance * 100) / 100; //two decimal

      const sender = {
        balance: newSenderBalance,
        prevBalance: senderBalance,
      } as any;

      const recipient = {
        balance: recipientBalance,
        prevBalance: currentBalance,
      } as any;

      const walletLog = {
        activity: WalletActivity.DEBIT,
        status: Status.SUCCESSFUL,
        uuid: wallet.uuid,
        sender: wallet.address,
        recipient: recipientWallet.address,
        amount: fundTransferDto.amount,
        ref: `ref${Helpers.getUniqueId()}`,
        channel: 'Transfer',
        narration: fundTransferDto.narration,
      } as any;

      await this.wallet.updateOne({ address }, sender);

      await this.wallet.updateOne(
        { address: recipientWallet.address },
        recipient,
      );

      await this.logService.saveWalletLog(walletLog);

      //notification
      await this.smsService.sendMessage(
        recipientUser.phoneNumber,
        `Your wallet has been credited with ${Helpers.convertToMoney(
          fundTransferDto.amount,
        )} via funds transfer from ${user.name}`,
      );

      await this.smsService.sendMessage(
        user.phoneNumber,
        `Your transfer of ${Helpers.convertToMoney(
          fundTransferDto.amount,
        )} to ${recipientUser.name} has been successful`,
      );

      const updatedWallet = await this.wallet.findOne({ address });
      return Helpers.success(updatedWallet);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findWalletByUuid(uuid: string): Promise<ApiResponse> {
    try {
      const wallet = await this.wallet.findOne({ uuid }).exec();

      if (wallet) return Helpers.success(wallet);

      return Helpers.fail(Messages.WalletNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findWalletByAddress(address: string): Promise<ApiResponse> {
    try {
      const wallet = await this.wallet.findOne({ address }).exec();

      if (wallet) return Helpers.success(wallet);

      return Helpers.fail(Messages.WalletNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async existByUuid(uuid: string): Promise<boolean> {
    try {
      const wallet = await this.wallet.findOne({ uuid }).exec();
      if (wallet) return true;
      return false;
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return false;
    }
  }
}
