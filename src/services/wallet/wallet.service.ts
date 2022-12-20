import { Injectable } from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Wallet, WalletDocument } from '../../schemas/wallet.schema';
import { Helpers } from '../../helpers/utitlity.helpers';
import { Messages } from 'src/utils/messages/messages';
import { SmsService } from '../sms/sms.service';
import { Status } from 'src/enums';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  FundWalletDto,
  FundsTransferDto,
  DebitWalletDto,
  WithdrawalRequestDto,
} from '../../dtos/wallet.dto';
import { WalletActivity } from '../../enums/enums';
import { LogsService } from '../logs/logs.service';
import { User, UserDocument } from '../../schemas/user.schema';
import { WalletWithdrawal } from '../../schemas/wallet-withdrawal.schema';
import { WithdrawalStatusDto } from '../../dtos/wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private wallet: Model<WalletDocument>,
    @InjectModel(WalletWithdrawal.name)
    private walletWithdrawal: Model<WalletWithdrawal>,
    @InjectModel(User.name) private user: Model<UserDocument>,
    private readonly logService: LogsService,
    private readonly smsService: SmsService,
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
      // const result = await this.verificationService.verifyTransaction(
      //   fundWalletDto.transactionId,
      //   fundWalletDto.amount,
      // );
      // if (!result.success) return Helpers.fail(result.message);

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

  async debitWallet(requestDto: DebitWalletDto): Promise<ApiResponse> {
    try {
      const wallet = await this.wallet
        .findOne({ address: requestDto.address })
        .exec();
      if (!wallet) return Helpers.fail('Wallet not found');
      const user = await this.user.findOne({ uuid: wallet.uuid });
      if (!user) return Helpers.fail('User not found');

      const currentBalance = wallet.balance;
      if (currentBalance < requestDto.amount) {
        return Helpers.fail('Wallet insufficient funds');
      }
      let newBalance = currentBalance - requestDto.amount;
      newBalance = Math.round(newBalance * 100) / 100; //two decimal

      const nData = {
        balance: newBalance,
        prevBalance: currentBalance,
      } as any;

      const walletLog = {
        activity: WalletActivity.DEBIT,
        status: Status.SUCCESSFUL,
        uuid: wallet.uuid,
        amount: requestDto.amount,
        ref: requestDto.transactionId,
        channel: requestDto.channel,
        narration: requestDto.narration,
      } as any;

      await this.wallet.updateOne({ address: requestDto.address }, nData);

      await this.logService.saveWalletLog(walletLog);

      //notification
      await this.smsService.sendMessage(
        user.phoneNumber,
        `DEBIT of ${Helpers.convertToMoney(
          requestDto.amount,
        )} is successful on your wallet for ${
          requestDto.channel
        }, transaction ref  ${requestDto.transactionId}`,
      );
      const updatedWallet = await this.wallet.findOne({
        address: requestDto.address,
      });
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

  async withdrawFunds(
    address: string,
    request: WithdrawalRequestDto,
  ): Promise<ApiResponse> {
    try {
      const wallet = await this.wallet.findOne({ address }).exec();
      if (!wallet) return Helpers.fail('Wallet not found');
      const user = await this.user.findOne({ uuid: wallet.uuid });
      if (!user) return Helpers.fail('User not found');

      if (request.amount < 5000)
        return Helpers.fail("Oops! You can't withdraw below 5k");

      if (wallet.balance < request.amount)
        return Helpers.fail('Insufficient funds');

      const existingWithdrawalRequest = await this.walletWithdrawal.findOne({
        uuid: user.uuid,
        walletId: user.walletAddress,
        status: Status.PENDING,
      });

      if (existingWithdrawalRequest)
        return Helpers.fail('Oops! You have pending withdrawal request!');

      const withdrawalRequest = {
        uuid: user.uuid,
        walletId: user.walletAddress,
        amount: request.amount,
        accountName: request.accountName,
        accountNumber: request.accountNumber,
        accountType: request.accountType,
        requestId: `ref${Helpers.getUniqueId()}`,
        status: Status.PENDING,
      } as WalletWithdrawal;

      const savedRequest = await (
        await this.walletWithdrawal.create(withdrawalRequest)
      ).save();

      //notification
      await this.smsService.sendMessage(
        user.phoneNumber,
        `We received your request to withdraw  ${Helpers.convertToMoney(
          request.amount,
        )} to  ${request.accountNumber} ${
          request.accountType
        }, We will get back in 48/hrs`,
      );

      await this.smsService.sendMessage(
        '08064160204',
        `You have wallet withdrawal request from ${user.name} ${
          user.phoneNumber
        },  ${Helpers.convertToMoney(request.amount)} to  ${
          request.accountNumber
        } ${request.accountType}, Get back to them soon`,
      );

      return Helpers.success(savedRequest);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateWithdrawalStatus(
    request: WithdrawalStatusDto,
  ): Promise<ApiResponse> {
    try {
      const existingWithdrawalRequest = await this.walletWithdrawal.findOne({
        requestId: request.requestId,
      });

      if (!existingWithdrawalRequest)
        return Helpers.fail('Withdrawal Request not found');

      const user = await this.user.findOne({
        uuid: existingWithdrawalRequest.uuid,
      });
      if (!user) return Helpers.fail('User not found');

      existingWithdrawalRequest.status = request.status;
      existingWithdrawalRequest.statusReason = request.reason;

      let message;

      if (request.status === Status.CANCELED)
        message = `Your  withdrawal request ${existingWithdrawalRequest.requestId} has been canceled "${request.reason}"`;
      else if (request.status === Status.INPROGRESS)
        message = `Your  withdrawal request ${existingWithdrawalRequest.requestId} is under review`;
      else if (request.status === Status.SUCCESSFUL)
        message = `Your  withdrawal request ${existingWithdrawalRequest.requestId} has been approved, you should receive the funds shortly.`;
      else return Helpers.fail('Invalid withdrawal request status');

      //notification
      await this.smsService.sendMessage(user.phoneNumber, message);
      const savedRequest = await (
        await this.walletWithdrawal.create(existingWithdrawalRequest)
      ).save();

      return Helpers.success(savedRequest);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteWallet(walletAddress: string): Promise<ApiResponse> {
    await this.wallet.deleteOne({
      walletId: walletAddress,
    });

    await this.walletWithdrawal.deleteOne({
      walletId: walletAddress,
    });
    return Helpers.success('Deleted successfully');
  }
  async getWithdrawalRequests(walletAddress: string): Promise<ApiResponse> {
    const requests = await this.walletWithdrawal.find({
      walletId: walletAddress,
    });
    if (requests.length > 0) {
      return Helpers.success(requests);
    }
    return Helpers.fail('No withdrawal request found');
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
