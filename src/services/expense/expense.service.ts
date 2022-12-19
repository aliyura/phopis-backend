import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { AccountType, Status, UserRole } from 'src/enums';
import { Helpers } from 'src/helpers';
import { ExpenseDto, UpdateExpenseDto } from '../../dtos/expense.dto';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';
import { Messages } from 'src/utils/messages/messages';
import { User } from '../../schemas/user.schema';
import { FilterDto } from '../../dtos/report-filter.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense.name)
    private expense: Model<ExpenseDocument>,
  ) {}

  async createExpense(
    authenticatedUser: User,
    requestDto: ExpenseDto,
  ): Promise<ApiResponse> {
    try {
      const request = {
        ...requestDto,
        code: Helpers.getCode(),
        businessId: authenticatedUser.businessId,
        euid: `ex${Helpers.getUniqueId()}`,
        createdBy: authenticatedUser.name,
        createdById: authenticatedUser.uuid,
      } as Expense;

      const saved = await this.expense.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateExpense(
    euid: string,
    requestDto: UpdateExpenseDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.expense.findOne({ euid }).exec();
      if (!response) return Helpers.fail('Expense not found');

      const saved = await this.expense.updateOne(
        { euid },
        { $set: requestDto },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteExpense(euid: string): Promise<ApiResponse> {
    try {
      const response = await this.expense.deleteOne({ euid }).exec();
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getExpenses(
    filterDto: FilterDto,
    page: number,
    authenticatedUser: User,
  ): Promise<ApiResponse> {
    try {
      const query = {} as any;
      query.businessId = authenticatedUser.businessId || authenticatedUser.uuid;

      if (filterDto.from && filterDto.to) {
        const from = new Date(filterDto.from);
        const to = new Date(filterDto.to);
        query.createdAt = {
          $gte: Helpers.formatDate(from),
          $lt: Helpers.formatToNextDay(to),
        };
      }

      console.log(query);

      const size = 20;
      const skip = page || 0;

      const count = await this.expense.count(query);
      const result = await this.expense
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

      return Helpers.fail('No expense found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchExpenses(
    filterDto: FilterDto,
    page: number,
    authenticatedUser: User,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const query = {
        $text: { $search: searchString },
      } as any;
      query.businessId = authenticatedUser.businessId || authenticatedUser.uuid;

      if (filterDto.from && filterDto.to) {
        const from = new Date(filterDto.from);
        const to = new Date(filterDto.to);
        query.createdAt = {
          $gte: Helpers.formatDate(from),
          $lt: Helpers.formatToNextDay(to),
        };
      }

      console.log(query);

      const size = 20;
      const skip = page || 0;

      const count = await this.expense.count(query);
      const result = await this.expense
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

      return Helpers.fail('No expense found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
