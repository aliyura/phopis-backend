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
import { ResourceType, SaleType, UserRole } from '../../enums/enums';
import { ServiceDocument, Service } from '../../schemas/service.schema';
import * as json2csv from 'json2csv';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(WalletLog.name) private walletLog: Model<WalletLogDocument>,
    @InjectModel(Sale.name) private sale: Model<SaleDocument>,
    @InjectModel(Product.name) private product: Model<ProductDocument>,
    @InjectModel(Service.name) private service: Model<ServiceDocument>,
    @InjectModel(Resource.name) private resource: Model<ResourceDocument>,
  ) {}
  async getWalletAnalytics(uuid: string): Promise<ApiResponse> {
    try {
      const response = await this.walletLog.find({
        uuid,
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

  async getProductInventory(authenticatedUser: User) {
    const query = {
      $or: [
        { businessId: authenticatedUser.businessId },
        { businessId: authenticatedUser.uuid },
      ],
    };

    const products = await this.product.find(query).sort({ createdAt: -1 });

    if (products.length) {
      const productAnalytic = await Promise.all(
        products.map(async (product) => {
          return {
            sold: product.initialQuantity - product.quantity,
            left: product.quantity,
          };
        }),
      );

      let sold, left;
      sold = left = 0;
      await productAnalytic.forEach((analytic) => {
        sold = sold + analytic.sold;
        left = left + analytic.left;
      });

      const analytics = {
        sold,
        left,
      };
      return Helpers.success(analytics);
    } else {
      return Helpers.fail('No product found');
    }
  }

  async getServicesInventory(authenticatedUser: User) {
    const query = {
      $or: [
        { businessId: authenticatedUser.businessId },
        { businessId: authenticatedUser.uuid },
      ],
    };
    const count = await this.service.count(query);
    if (count) {
      const analytics = {
        sold: '*',
        left: count,
      };
      return Helpers.success(analytics);
    } else {
      return Helpers.fail('No service found');
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
      const saleData = await this.sale.find(query).sort({ createdAt: -1 });
      const sales = saleData as any;

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
      let total, totalSold, totalLeft, totalRevenue;
      total = totalSold = totalLeft = totalRevenue = 0;

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
                    total: sale.totalAmount,
                    totalSold: product.initialQuantity - product.quantity,
                    totalRevenue: sale.totalRevenue,
                    totalLeft: product.quantity,
                    transDate: sale.createAt,
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
                    total: sale.totalAmount,
                    totalSold,
                    totalLeft: 1,
                    totalRevenue: sale.totalRevenue,
                    transDate: sale.createdAt,
                  };
                }
                return itemData;
              }),
            );

            let itemId,
              itemName,
              itemType,
              itemCategory,
              total,
              totalSold,
              totalLeft,
              totalRevenue,
              transDate;
            total = totalSold = totalLeft = totalRevenue = 0;

            itemsAnalytic.forEach((item) => {
              itemId = item.id;
              itemName = item.name;
              itemType = item.type;
              itemCategory = item.category;
              total = item.total;
              totalSold = item.totalSold;
              totalLeft = item.totalLeft;
              totalRevenue = item.totalRevenue;
              transDate = item.transDate;
            });

            return {
              itemId,
              itemName,
              itemType,
              itemCategory,
              total,
              totalRevenue,
              totalSold,
              totalLeft,
              transDate,
            };
          }),
        );
      }
      await salesAnalytic.forEach((analytic) => {
        total = total + analytic.total;
        totalSold = totalSold + analytic.totalSold;
        totalLeft = totalLeft + analytic.totalLeft;
        totalRevenue = totalRevenue + analytic.totalRevenue;
      });

      const analytics = {
        total,
        totalSold,
        totalLeft,
        totalRevenue,
        totalDiscount,
        breakdown: salesAnalytic,
      };
      return Helpers.success(analytics);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async downloadInventoryAnalytics(
    authenticatedUser: User,
    requestDto: FilterDto,
  ): Promise<ApiResponse> {
    const reportResponse = await this.getInventoryAnalytics(
      authenticatedUser,
      requestDto,
    );

    const response = {} as any;

    if (reportResponse.success) {
      const data = reportResponse.data;
      const filePath = path.join(__dirname, '../../../', 'public', 'exports');
      const fields = [
        'itemId',
        'itemName',
        'itemType',
        'itemCategory',
        'total',
        'totalRevenue',
        'totalSold',
        'totalLeft',
        'transDate',
      ];
      let csv;
      try {
        const breakdown = [];
        if (authenticatedUser.role === UserRole.USER) {
          data.breakdown.forEach((item) => {
            if (authenticatedUser.role === UserRole.USER)
              item.totalRevenue = '****';
            breakdown.push(item);
          });
        }
        csv = await json2csv.parse(
          authenticatedUser.role === UserRole.USER ? breakdown : data.breakdown,
          { fields },
        );
      } catch (err) {
        console.log(err);
        return Helpers.fail('Unable to generate CSV');
      }
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }

      const fileName = 'report-' + authenticatedUser.uuid + '.csv';
      try {
        await fs.writeFileSync(filePath + '/' + fileName, csv);
      } catch (ex) {
        return Helpers.fail('Unable to build CSV');
      }
      response.url = process.env.APP_URL + `/public/exports/${fileName}`;
      response.type = 'CSV';
    }
    return Helpers.success(response);
  }

  async getResourceAnalytics(authenticatedUser: User): Promise<ApiResponse> {
    try {
      const query = {
        currentOwnerUuid:
          authenticatedUser.accountType === AccountType.BUSINESS
            ? authenticatedUser.businessId
            : authenticatedUser.uuid,
      } as any;

      const resources = await this.resource.find(query).sort({ createdAt: -1 });

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
