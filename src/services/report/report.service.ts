import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { WalletLog } from 'src/schemas/wallet-logs.schema';
import { WalletLogDocument } from '../../schemas/wallet-logs.schema';
import { Helpers } from 'src/helpers';
import { Messages } from 'src/utils/messages/messages';
import { AccountType, WalletActivity } from 'src/enums';
import { Sale, SaleDocument } from '../../schemas/sale-chema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { User } from '../../schemas/user.schema';
import { FilterDto } from '../../dtos/report-filter.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(WalletLog.name) private walletLog: Model<WalletLogDocument>,
    @InjectModel(Sale.name) private sale: Model<SaleDocument>,
    @InjectModel(Product.name) private product: Model<ProductDocument>,
  ) {}
  async getWalletAnalytics(address: string): Promise<ApiResponse> {
    try {
      const response = await this.walletLog.find({
        address,
      });

      if (response) {
        let totalDebit = 0;
        let totalCredit = 0;
        await response.forEach((transaction) => {
          if (transaction.activity === WalletActivity.CREDIT) {
            totalCredit += transaction.amount;
          } else {
            totalDebit += transaction.amount;
          }
        });

        const result = {
          totalDebit,
          totalCredit,
        };
        return Helpers.success(result);
      }
      return Helpers.fail('No transaction found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getInventoryAnalytics(
    authenticatedUser: User,
    requestDto: FilterDto,
  ): Promise<ApiResponse> {
    try {
      const query = {} as any;
      if (authenticatedUser.accountType === AccountType.BUSINESS) {
        query.businessId = authenticatedUser.businessId;
      }
      if (requestDto.from || requestDto.to) {
        if (!requestDto.from) requestDto.from = new Date().toISOString();
        if (!requestDto.to) requestDto.to = new Date().toISOString();

        const isoFrom = new Date(requestDto.from).toISOString();
        const isoTo = new Date(requestDto.to).toISOString();
        query.createdAt = {
          $gt: isoFrom,
          $lt: isoTo,
        };
      }

      let totalDiscount = 0;
      const products = await this.product.find(query);

      if (!products.length) return Helpers.fail('No product found');

      const sales = await this.sale.find({
        createdById: authenticatedUser.uuid,
        createdAt: query.createdAt,
      });

      if (sales.length) {
        const salesAnalytic = await Promise.all(
          sales.map(async (sale) => {
            return { totalDiscount: sale.totalDiscount };
          }),
        );

        await salesAnalytic.forEach((analytic) => {
          totalDiscount = totalDiscount + analytic.totalDiscount;
        });
      }

      const productAnalytic = await Promise.all(
        products.map(async (product) => {
          const totalSold = product.initialQuantity - product.quantity;
          const totalIncome = product.sellingPrice - product.purchasePrice;
          return {
            productId: product.puid,
            productName: product.title,
            productType: product.type,
            productCategory: product.category,
            total: product.initialQuantity,
            totalSold,
            totalLeft: product.quantity,
            totalIncome: totalSold > 0 ? totalIncome * totalSold : 0,
          };
        }),
      );

      let total, totalSold, totalLeft, totalIncome;
      total = totalSold = totalLeft = totalIncome = 0;

      await productAnalytic.forEach((analytic) => {
        total = total + analytic.total;
        totalSold = totalSold + analytic.totalSold;
        totalLeft = totalLeft + analytic.totalLeft;
        totalIncome = totalIncome + analytic.totalIncome;
      });

      const analytics = {
        total,
        totalSold,
        totalLeft,
        totalIncome,
        totalDiscount,
        breakdown: productAnalytic,
      };
      return Helpers.success(analytics);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
