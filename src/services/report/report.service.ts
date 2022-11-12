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
import { ResourceDocument, Resource } from '../../schemas/resource.schema';
import { ResourceType, SaleType } from '../../enums/enums';
import { ServiceDocument, Service } from '../../schemas/service.schema';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(WalletLog.name) private walletLog: Model<WalletLogDocument>,
    @InjectModel(Sale.name) private sale: Model<SaleDocument>,
    @InjectModel(Product.name) private product: Model<ProductDocument>,
    @InjectModel(Service.name) private service: Model<ServiceDocument>,
    @InjectModel(Resource.name) private resource: Model<ResourceDocument>,
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
      const sales = await this.sale.find(query);

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

      let salesAnalytic = [];
      let total, totalSold, totalLeft, totalIncome;
      total = totalSold = totalLeft = totalIncome = 0;

      if (sales.length) {
        salesAnalytic = await Promise.all(
          sales.map(async (sale) => {
            const itemsAnalytic = await Promise.all(
              sale.items.map(async (item) => {
                let itemData = {} as any;

                if (sale.type === SaleType.PRODUCT) {
                  const product = await this.product.findOne({
                    puid: item.id,
                  });
                  itemData = {
                    id: product.puid,
                    name: product.title,
                    type: product.type,
                    category: product.category,
                    total: product.sellingPrice,
                    totalSold: product.initialQuantity - product.quantity,
                    totalIncome: product.sellingPrice - product.purchasePrice,
                    totalLeft: product.quantity,
                  };
                } else {
                  const service = await this.service.findOne({
                    suid: item.id,
                  });

                  const totalSold = await this.sale.count({
                    'items.id': item.id,
                  });

                  itemData = {
                    id: service.suid,
                    name: service.title,
                    type: service.type,
                    category: 'N/A',
                    total: service.charges,
                    totalSold,
                    totalLeft: 1,
                    totalIncome: service.revenue,
                  };
                }
                return itemData;
              }),
            );

            let itemId;
            let itemName;
            let itemType;
            let itemCategory;
            let total;
            let totalSold;
            let totalLeft;
            let totalIncome;
            total = totalSold = totalLeft = totalIncome = 0;

            itemsAnalytic.forEach((item) => {
              itemId = item.id;
              itemName = item.name;
              itemType = item.type;
              itemCategory = item.category;
              total = item.total;
              totalSold = item.totalSold;
              totalLeft = item.totalLeft;
              totalIncome = item.totalIncome * item.totalSold;
            });

            return {
              itemId,
              itemName,
              itemType,
              itemCategory,
              total,
              totalSold,
              totalLeft,
              totalIncome,
            };
          }),
        );
      }
      await salesAnalytic.forEach((analytic) => {
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
        breakdown: salesAnalytic,
      };
      return Helpers.success(analytics);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getResourceAnalytics(authenticatedUser: User): Promise<ApiResponse> {
    try {
      const query = {
        currentOwnerUuid:
          authenticatedUser.accountType === AccountType.BUSINESS
            ? authenticatedUser.businessId
            : authenticatedUser.uuid,
      } as any;

      const resources = await this.resource.find(query);

      const analytic = {
        All: 0,
        Vehicles: 0,
        SmartDevices: 0,
        Houses: 0,
        Land: 0,
      };
      let counter = 0;

      if (resources.length)
        await resources.forEach((resource) => {
          counter++;
          analytic.All = counter;

          if (resource.type === ResourceType.SMARTDEVICE)
            analytic.SmartDevices += 1;
          if (resource.type === ResourceType.VEHICLE) analytic.Vehicles += 1;
          if (resource.type === ResourceType.HOUSE) analytic.Houses += 1;
          if (resource.type === ResourceType.LAND) analytic.Land += 1;
        });

      return Helpers.success(analytic);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
