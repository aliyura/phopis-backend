import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { AccountType, ActionType, Status, UserRole } from 'src/enums';
import { Helpers } from 'src/helpers';
import { DebtDto, DebtRepaymentDto, UpdateDebtDto } from '../../dtos/debt.dto';
import { Model } from 'mongoose';
import { Debt, DebtDocument } from '../../schemas/debt.schema';
import { Messages } from 'src/utils/messages/messages';
import { User } from '../../schemas/user.schema';
import { FilterDto } from '../../dtos/report-filter.dto';

@Injectable()
export class DebtService {
  constructor(
    @InjectModel(Debt.name)
    private debt: Model<DebtDocument>,
  ) {}

  async createDebt(
    authenticatedUser: User,
    requestDto: DebtDto,
  ): Promise<ApiResponse> {
    try {
      if (!Helpers.validPhoneNumber(requestDto.debtorPhoneNumber)) {
        return Helpers.fail('Phone Number provided is not valid');
      }
      const request = {
        ...requestDto,
        clearedAmount: 0,
        code: Helpers.getCode(),
        status: Status.PENDING,
        businessId: authenticatedUser.businessId,
        duid: `de${Helpers.getUniqueId()}`,
        createdBy: authenticatedUser.name,
        createdById: authenticatedUser.uuid,
      } as Debt;

      const saved = await this.debt.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async debtRepayment(
    authenticatedUser: User,
    requestDto: DebtRepaymentDto,
  ): Promise<ApiResponse> {
    try {
      const debt = await this.debt.findOne({ duid: requestDto.duid }).exec();
      if (!debt) return Helpers.fail('Debt not found');
      if (requestDto.amount <= 0)
        return Helpers.fail('You can only repay above Zero');

      const debtBalance = debt.amount - debt.clearedAmount;
      if (debtBalance <= 0)
        return Helpers.fail('This debt has already been cleared');

      if (debtBalance < requestDto.amount)
        return Helpers.fail(
          "You can't repay higher than what is owed, balance is " + debtBalance,
        );

      const request = {
        clearedAmount: debt.clearedAmount + requestDto.amount,
        lastPaidDate: new Date().toISOString(),
      } as any;

      if (debtBalance <= 0) request.status = Status.CLOSED;

      const updateHistory = {
        ...requestDto,
        actionType: ActionType.UPDATE,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };

      await this.debt.updateOne(
        { duid: requestDto.duid },
        {
          $set: request,
          $push: {
            updateHistory: updateHistory,
          },
        },
      );
      return Helpers.success(
        await this.debt.findOne({
          duid: requestDto.duid,
        }),
      );
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateDebt(
    duid: string,
    requestDto: UpdateDebtDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.debt.findOne({ duid }).exec();

      if (!response) return Helpers.fail('Debt not found');

      const saved = await this.debt.updateOne({ duid }, { $set: requestDto });
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteDebt(duid: string): Promise<ApiResponse> {
    try {
      const response = await this.debt.deleteOne({ duid }).exec();
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getDebts(
    filterDto: FilterDto,
    page: number,
    authenticatedUser: User,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const query = {} as any;
      if (authenticatedUser.role === UserRole.BUSINESS)
        query.businessId = authenticatedUser.businessId;

      if (
        status &&
        Object.values(Status).includes(status.toUpperCase() as Status)
      ) {
        query.status = status.toUpperCase();
      }

      if (filterDto.from && filterDto.to) {
        const isoFrom = new Date(filterDto.from).toISOString();
        const isoTo = new Date(filterDto.to).toISOString();
        query.createdAt = {
          $gt: isoFrom,
          $lt: isoTo,
        };
      }
      console.log(query);

      const size = 20;
      const skip = page || 0;

      const count = await this.debt.count(query);
      const result = await this.debt
        .find(query)
        .skip(skip * size)
        .limit(size)
        .sort({ createdAt: -1 });

      if (result.length) {
        const totalPages = Math.round(count / size);
        return Helpers.success({
          page: result,
          size: size,
          currentPage: Number(skip),
          totalPages:
            totalPages > 0
              ? totalPages
              : count > 0 && result.length > 0
              ? 1
              : 0,
        });
      }

      return Helpers.fail('No debt found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchDebts(
    filterDto: FilterDto,
    page: number,
    authenticatedUser: User,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const query = {
        $text: { $search: searchString },
      } as any;
      if (authenticatedUser.accountType === AccountType.BUSINESS) {
        query.businessId = authenticatedUser.businessId;
      }

      if (filterDto.from && filterDto.to) {
        const isoFrom = new Date(filterDto.from).toISOString();
        const isoTo = new Date(filterDto.to).toISOString();
        query.createdAt = {
          $gt: isoFrom,
          $lt: isoTo,
        };
      }
      console.log(query);

      const size = 20;
      const skip = page || 0;

      const count = await this.debt.count(query);
      const result = await this.debt
        .find(query)
        .skip(skip * size)
        .limit(size)
        .sort({ createdAt: -1 });

      if (result.length) {
        const totalPages = Math.round(count / size);
        return Helpers.success({
          page: result,
          size: size,
          currentPage: Number(skip),
          totalPages:
            totalPages > 0
              ? totalPages
              : count > 0 && result.length > 0
              ? 1
              : 0,
        });
      }

      return Helpers.fail('No debt found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
