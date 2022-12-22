import { Injectable } from '@nestjs/common';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Unit, UnitDocument } from '../../schemas/unit.schema';
import { Helpers } from '../../helpers/utitlity.helpers';
import { Messages } from 'src/utils/messages/messages';
import { SmsService } from '../sms/sms.service';
import { Status } from 'src/enums';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  BuyUnitDto,
  UnitTransferDto,
  DebitUnitDto,
  WithdrawalRequestDto,
  WithdrawalStatusDto,
} from './../../dtos/unit.dto';
import { UnitActivity } from '../../enums/enums';
import { LogsService } from '../logs/logs.service';
import { User, UserDocument } from '../../schemas/user.schema';
import { UnitWithdrawal } from '../../schemas/unit-withdrawal.schema';
import { FundUnitDto } from '../../dtos/unit.dto';

@Injectable()
export class UnitService {
  constructor(
    @InjectModel(Unit.name) private unit: Model<UnitDocument>,
    @InjectModel(UnitWithdrawal.name)
    private unitWithdrawal: Model<UnitWithdrawal>,
    @InjectModel(User.name) private user: Model<UserDocument>,
    private readonly logService: LogsService,
    private readonly smsService: SmsService,
  ) {}

  async createUnitAccount(uuid: string, code: number): Promise<ApiResponse> {
    try {
      //create unit
      if (!uuid) return Helpers.fail('Unit user id required');

      //check if user already have unit
      const alreadyExist = await this.existByUuid(uuid);
      if (alreadyExist) return Helpers.fail('User already have a unit account');

      const request = {
        uuid,
        userCode: code,
        address: Helpers.getUniqueId(),
        code: Helpers.getCode(),
        status: Status.ACTIVE,
        balance: 1000,
      } as any;

      const createdUnit = await (await this.unit.create(request)).save();
      return Helpers.success(createdUnit);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async fundUnit(unitRequest: FundUnitDto): Promise<ApiResponse> {
    const unit = await this.unit
      .findOne({ address: unitRequest.unitAddress })
      .exec();
    if (!unit) return Helpers.fail('Unit account not found');

    const currentBalance = unit.balance;
    let newBalance = currentBalance + unitRequest.amount;
    newBalance = Math.round(newBalance * 100) / 100; //two decimal

    const nData = {
      balance: newBalance,
      prevBalance: currentBalance,
    } as any;

    const unitLog = {
      activity: UnitActivity.CREDIT,
      status: Status.SUCCESSFUL,
      uuid: unit.uuid,
      address: unit.address,
      amount: unitRequest.amount,
      ref: unitRequest.paymentRef,
      channel: unitRequest.channel,
    } as any;

    await this.unit.updateOne({ address: unitRequest.unitAddress }, nData);
    await this.logService.saveUnitLog(unitLog);

    //notification
    const user = await this.user.findOne({
      phoneNumber: unitRequest.accountId,
    });
    if (user) {
      await this.smsService.sendMessage(
        user.phoneNumber,
        `Your account has been credited with ${Helpers.convertToMoney(
          unitRequest.amount,
        )} unit`,
      );
    }
    const updatedUnit = await this.unit.findOne({
      address: user.unitAddress,
    });
    return Helpers.success(updatedUnit);
  }
  catch(ex) {
    console.log(Messages.ErrorOccurred, ex);
    return Helpers.fail(Messages.Exception);
  }

  async buyUnit(buyUnitDto: BuyUnitDto): Promise<ApiResponse> {
    try {
      console.log('buyUnitDto', buyUnitDto);
      const user = await this.user.findOne({
        phoneNumber: buyUnitDto.customer.phone,
      });
      if (!user) return Helpers.fail('User not found');

      const unit = await this.unit
        .findOne({ address: user.unitAddress })
        .exec();
      if (!unit) return Helpers.fail('Unit account not found');

      const currentBalance = unit.balance;
      let newBalance = currentBalance + buyUnitDto.amount;
      newBalance = Math.round(newBalance * 100) / 100; //two decimal

      const nData = {
        balance: newBalance,
        prevBalance: currentBalance,
      } as any;

      const unitLog = {
        activity: UnitActivity.CREDIT,
        status: Status.SUCCESSFUL,
        uuid: unit.uuid,
        address: unit.address,
        amount: buyUnitDto.amount,
        ref: buyUnitDto.flwRef,
        channel: 'Funding',
      } as any;
      console.log('unitLog', unitLog);
      await this.logService.saveUnitLog(unitLog);

      await this.unit.updateOne({ address: user.unitAddress }, nData);

      //notification
      await this.smsService.sendMessage(
        user.phoneNumber,
        `Your account has been credited with ${Helpers.convertToMoney(
          buyUnitDto.amount,
        )} unit`,
      );
      const updatedUnit = await this.unit.findOne({
        address: user.unitAddress,
      });
      return Helpers.success(updatedUnit);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async debitUnit(
    requestDto: DebitUnitDto,
    sendSMS: boolean = false,
  ): Promise<ApiResponse> {
    try {
      const unit = await this.unit
        .findOne({ address: requestDto.address })
        .exec();
      if (!unit) return Helpers.fail('Unit account not found');
      const user = await this.user.findOne({ uuid: unit.uuid });
      if (!user) return Helpers.fail('User not found');

      const currentBalance = unit.balance;
      if (currentBalance < requestDto.amount) {
        return Helpers.fail('Insufficient units');
      }
      let newBalance = currentBalance - requestDto.amount;
      newBalance = Math.round(newBalance * 100) / 100; //two decimal

      const nData = {
        balance: newBalance,
        prevBalance: currentBalance,
      } as any;

      const unitLog = {
        activity: UnitActivity.DEBIT,
        status: Status.SUCCESSFUL,
        address: unit.address,
        uuid: unit.uuid,
        amount: requestDto.amount,
        ref: requestDto.transactionId,
        channel: requestDto.channel,
        narration: requestDto.narration,
      } as any;

      await this.unit.updateOne({ address: requestDto.address }, nData);

      await this.logService.saveUnitLog(unitLog);

      if (sendSMS) {
        //notification
        await this.smsService.sendMessage(
          user.phoneNumber,
          `DEBIT of ${Helpers.convertToMoney(
            requestDto.amount,
          )} is successful on your account for ${
            requestDto.channel
          }, transaction ref  ${requestDto.transactionId}`,
        );
      }
      const updatedUnit = await this.unit.findOne({
        address: requestDto.address,
      });
      return Helpers.success(updatedUnit);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async fundsTransfer(
    address: string,
    fundTransferDto: UnitTransferDto,
  ): Promise<ApiResponse> {
    try {
      const unit = await this.unit.findOne({ address }).exec();
      if (!unit) return Helpers.fail('Unit account not found');
      const user = await this.user.findOne({ uuid: unit.uuid });
      if (!user) return Helpers.fail('User not found');

      const recipientUnit = await this.unit
        .findOne({ code: fundTransferDto.recipient })
        .exec();
      if (!recipientUnit)
        return Helpers.fail('Recipient Unit account not found');

      const senderBalance = unit.balance;
      if (senderBalance < fundTransferDto.amount)
        return Helpers.fail('Insufficient units');

      const recipientUser = await this.user.findOne({
        uuid: recipientUnit.uuid,
      });
      if (!recipientUser) return Helpers.fail('Recipient not found');

      const currentBalance = recipientUnit.balance;
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

      const unitLog = {
        activity: UnitActivity.DEBIT,
        status: Status.SUCCESSFUL,
        uuid: unit.uuid,
        address: unit.address,
        sender: unit.address,
        recipient: recipientUnit.address,
        amount: fundTransferDto.amount,
        ref: `ref${Helpers.getUniqueId()}`,
        channel: 'Unit Transfer',
        narration: fundTransferDto.narration,
      } as any;

      await this.unit.updateOne({ address }, sender);

      await this.unit.updateOne({ address: recipientUnit.address }, recipient);

      await this.logService.saveUnitLog(unitLog);

      //notification
      await this.smsService.sendMessage(
        recipientUser.phoneNumber,
        `Your account has been credited with ${Helpers.convertToMoney(
          fundTransferDto.amount,
        )} via unit transfer from ${user.name}`,
      );

      await this.smsService.sendMessage(
        user.phoneNumber,
        `Your unit transfer of ${Helpers.convertToMoney(
          fundTransferDto.amount,
        )} to ${recipientUser.name} has been successful`,
      );

      const updatedUnit = await this.unit.findOne({ address });
      return Helpers.success(updatedUnit);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async withdrawUnits(
    address: string,
    request: WithdrawalRequestDto,
  ): Promise<ApiResponse> {
    try {
      const unit = await this.unit.findOne({ address }).exec();
      if (!unit) return Helpers.fail('Unit account not found');
      const user = await this.user.findOne({ uuid: unit.uuid });
      if (!user) return Helpers.fail('User not found');

      if (request.amount < 5000)
        return Helpers.fail("Oops! You can't withdraw below 5k");

      if (unit.balance < request.amount)
        return Helpers.fail('Insufficient units');

      const existingWithdrawalRequest = await this.unitWithdrawal.findOne({
        uuid: user.uuid,
        unitId: user.unitAddress,
        status: Status.PENDING,
      });

      if (existingWithdrawalRequest)
        return Helpers.fail('Oops! You have pending unit withdrawal request!');

      const withdrawalRequest = {
        uuid: user.uuid,
        unitId: user.unitAddress,
        amount: request.amount,
        accountName: request.accountName,
        accountNumber: request.accountNumber,
        accountType: request.accountType,
        requestId: `ref${Helpers.getUniqueId()}`,
        status: Status.PENDING,
      } as UnitWithdrawal;

      const savedRequest = await (
        await this.unitWithdrawal.create(withdrawalRequest)
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
        `You have unit withdrawal request from ${user.name} ${
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
      const existingWithdrawalRequest = await this.unitWithdrawal.findOne({
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

      const unitResponse = await this.findUnitByAddress(
        existingWithdrawalRequest.unitId,
      );
      const unit = unitResponse.data;
      if (!unitResponse.success) return Helpers.fail('Unit not found');

      let message;
      if (request.status === Status.CANCELED) {
        message = `Your  withdrawal request ${existingWithdrawalRequest.requestId} has been canceled "${request.reason}"`;
      } else if (request.status === Status.INPROGRESS) {
        message = `Your  withdrawal request ${existingWithdrawalRequest.requestId} is under review`;
      } else if (request.status === Status.SUCCESSFUL) {
        const request = {
          address: unit.address,
          transactionId: existingWithdrawalRequest.requestId,
          channel: 'Withdrawal',
          amount: existingWithdrawalRequest.amount,
          narration: 'Withdrawal request',
        };
        const response = await this.debitUnit(request);
        if (response.success) {
          message = `Your  withdrawal request ${existingWithdrawalRequest.requestId} has been approved, you should receive the funds shortly.`;
        } else {
          return Helpers.fail(response.message);
        }
      } else {
        return Helpers.fail('Invalid withdrawal request status');
      }

      //notification
      await this.smsService.sendMessage(user.phoneNumber, message);
      const savedRequest = await (
        await this.unitWithdrawal.create(existingWithdrawalRequest)
      ).save();

      return Helpers.success(savedRequest);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteUnit(unitAddress: string): Promise<ApiResponse> {
    await this.unit.deleteOne({
      unitId: unitAddress,
    });

    await this.unitWithdrawal.deleteOne({
      unitId: unitAddress,
    });
    return Helpers.success('Deleted successfully');
  }
  async getWithdrawalRequests(unitAddress: string): Promise<ApiResponse> {
    const requests = await this.unitWithdrawal.find({
      unitId: unitAddress,
    });
    if (requests.length > 0) {
      return Helpers.success(requests);
    }
    return Helpers.fail('No withdrawal request found');
  }

  async findUnitByUuid(uuid: string): Promise<ApiResponse> {
    try {
      const unit = await this.unit.findOne({ uuid }).exec();

      if (unit) return Helpers.success(unit);

      return Helpers.fail(Messages.UnitNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findUnitByAddress(address: string): Promise<ApiResponse> {
    try {
      const unit = await this.unit.findOne({ address }).exec();
      if (unit) return Helpers.success(unit);

      return Helpers.fail(Messages.UnitNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async existByUuid(uuid: string): Promise<boolean> {
    try {
      const unit = await this.unit.findOne({ uuid }).exec();
      if (unit) return true;
      return false;
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return false;
    }
  }
}
