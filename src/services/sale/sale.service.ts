import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { UserDocument, User } from 'src/schemas/user.schema';

import { Messages } from 'src/utils/messages/messages';
import {
  SaleDto,
  SaleProductsDto,
  TransactionDto,
  TransactionServicesDto,
} from '../../dtos/sale.dto';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { AccountType, Status, UserRole, SaleType } from '../../enums/enums';
import { Sale, SaleDocument } from '../../schemas/sale-chema';
import { Service, ServiceDocument } from '../../schemas/service.schema';

@Injectable()
export class SaleService {
  constructor(
    @InjectModel(Product.name)
    private product: Model<ProductDocument>,
    @InjectModel(Service.name)
    private service: Model<ServiceDocument>,
    @InjectModel(Sale.name)
    private sale: Model<SaleDocument>,
    @InjectModel(User.name)
    private user: Model<UserDocument>,
  ) {}

  async createSale(
    authenticatedUser: User,
    requestDto: SaleDto,
  ): Promise<ApiResponse> {
    try {
      if (authenticatedUser.accountType !== AccountType.BUSINESS) {
        return Helpers.fail(Messages.NoPermission);
      }
      if (requestDto.customerAccountCode) {
        const customer = await this.user.findOne({
          code: requestDto.customerAccountCode,
        });
        if (customer) {
          requestDto.customerName = customer.name;
          requestDto.customerPhoneNumber = customer.phoneNumber;
        } else {
          return Helpers.fail('Invalid customer account number');
        }
      } else {
        if (!requestDto.customerName || requestDto.customerName.length < 3) {
          return Helpers.fail('Valid customer name required');
        } else if (
          !requestDto.customerPhoneNumber ||
          !Helpers.validPhoneNumber(requestDto.customerPhoneNumber)
        ) {
          return Helpers.fail('Valid customer phone number required');
        }
      }

      if (!requestDto.products.length)
        return Helpers.fail('Provide selected sale products');

      const products = requestDto.products as SaleProductsDto[];

      //validate products
      let productCheckPassed = true;

      const response = await Promise.all(
        products.map(async (request) => {
          let totalPayable = 0;

          //do check
          if (!request.productId) {
            productCheckPassed = false;
            return Helpers.failure(request, `Product required`);
          } else if (!request.quantity || request.quantity <= 0) {
            productCheckPassed = false;
            return Helpers.failure(request, `Provide product quantity`);
          }

          //do  check
          const currentProduct = await this.product.findOne({
            puid: request.productId,
          });
          if (!currentProduct) {
            productCheckPassed = false;
            return Helpers.failure(request, `Product not found`);
          }

          if (currentProduct.quantity < request.quantity) {
            productCheckPassed = false;
            return Helpers.failure(
              request,
              `Out of stuck, (${currentProduct.quantity}) ${currentProduct.title} left`,
            );
          }

          totalPayable += currentProduct.sellingPrice * request.quantity;
          const totalRevenue =
            (currentProduct.purchasePrice - currentProduct.sellingPrice) *
            request.quantity;

          const response = {
            id: request.productId,
            name: currentProduct.title,
            type: currentProduct.type,
            category: currentProduct.category,
            quantity: request.quantity,
            totalPayable,
            totalRevenue,
          };
          return response;
        }),
      );

      if (productCheckPassed) {
        const saleRequest = response as any[];
        let totalAmount, totalRevenue;
        totalAmount = totalRevenue = 0;
        const totalDiscount = requestDto.discount ? requestDto.discount : 0;

        //get total payable
        await saleRequest.forEach(async (sale) => {
          totalAmount += sale.totalPayable;
          totalRevenue += sale.totalRevenue;
        });

        //update purchased items
        const purchasedItems = await Promise.all(
          saleRequest.map(async (sale) => {
            const theProduct = await this.product.findOne({
              puid: sale.id,
            });

            theProduct.quantity = theProduct.quantity - sale.quantity;
            return theProduct;
          }),
        );

        totalAmount = totalAmount - totalDiscount;
        const code = Helpers.getCode();
        const saleId = `sal${Helpers.getUniqueId()}`;
        const businessId = authenticatedUser.businessId;

        const request = {
          customerAccountCode: requestDto.customerAccountCode,
          customerPhoneNumber: requestDto.customerPhoneNumber,
          customerName: requestDto.customerName,
          totalAmount,
          totalDiscount,
          totalRevenue,
          status: Status.SUCCESSFUL,
          code: code,
          suid: saleId,
          type: SaleType.PRODUCT,
          items: saleRequest,
          businessId: businessId,
          createdBy: authenticatedUser.name,
          createdById: authenticatedUser.uuid,
        } as any;

        await this.product.create(purchasedItems);
        const saved = await (await this.sale.create(request)).save();
        return Helpers.success(saved);
      } else {
        return Helpers.failure(response, 'Unable to complete your request');
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async createTransaction(
    authenticatedUser: User,
    requestDto: TransactionDto,
  ): Promise<ApiResponse> {
    try {
      if (authenticatedUser.accountType !== AccountType.BUSINESS) {
        return Helpers.fail(Messages.NoPermission);
      }
      if (requestDto.customerAccountCode) {
        const customer = await this.user.findOne({
          code: requestDto.customerAccountCode,
        });
        if (customer) {
          requestDto.customerName = customer.name;
          requestDto.customerPhoneNumber = customer.phoneNumber;
        } else {
          return Helpers.fail('Invalid customer account number');
        }
      } else {
        if (!requestDto.customerName || requestDto.customerName.length < 3) {
          return Helpers.fail('Valid customer name required');
        } else if (
          !requestDto.customerPhoneNumber ||
          !Helpers.validPhoneNumber(requestDto.customerPhoneNumber)
        ) {
          return Helpers.fail('Valid customer phone number required');
        }
      }

      if (!requestDto.services.length)
        return Helpers.fail('Provide transaction service');

      const services = requestDto.services as TransactionServicesDto[];
      let serviceCheckPassed = true;

      const response = await Promise.all(
        services.map(async (request) => {
          let totalPayable = 0;

          //do check
          if (!request.serviceId) {
            serviceCheckPassed = false;
            return Helpers.failure(request, `Service required`);
          } else if (!request.quantity || request.quantity <= 0) {
            serviceCheckPassed = false;
            return Helpers.failure(request, `Provide service quantity`);
          }

          const currentService = await this.service.findOne({
            suid: request.serviceId,
          });

          if (!currentService) {
            serviceCheckPassed = false;
            return Helpers.failure(request, `Service not found`);
          }

          totalPayable += currentService.charges * request.quantity;
          let totalRevenue = currentService.revenue * request.quantity;
          if (currentService.type === 'POS')
            totalRevenue = Helpers.calculatePOSTransactionCharges(totalPayable);

          const response = {
            id: request.serviceId,
            name: currentService.title,
            type: currentService.type,
            quantity: request.quantity,
            totalPayable,
            totalRevenue,
          };
          return response;
        }),
      );

      if (serviceCheckPassed) {
        const saleRequest = response as any[];
        let totalAmount, totalRevenue;
        totalAmount = totalRevenue = 0;
        const totalDiscount = requestDto.discount ? requestDto.discount : 0;

        //get total payable
        await saleRequest.forEach(async (sale) => {
          totalAmount += sale.totalPayable;
          totalRevenue += sale.totalRevenue;
        });

        totalAmount = totalAmount - totalDiscount;
        const code = Helpers.getCode();
        const transactionId = `tra${Helpers.getUniqueId()}`;
        const businessId = authenticatedUser.businessId;

        const request = {
          customerAccountCode: requestDto.customerAccountCode,
          customerPhoneNumber: requestDto.customerPhoneNumber,
          customerName: requestDto.customerName,
          totalAmount,
          totalRevenue,
          totalDiscount,
          status: Status.SUCCESSFUL,
          code: code,
          type: SaleType.SERVICE,
          suid: transactionId,
          items: saleRequest,
          businessId: businessId,
          createdBy: authenticatedUser.name,
          createdById: authenticatedUser.uuid,
        } as any;
        const saved = await (await this.sale.create(request)).save();
        return Helpers.success(saved);
      } else {
        return Helpers.failure(response, 'Unable to complete your request');
      }
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findById(puid: string): Promise<ApiResponse> {
    try {
      const response = await this.sale.findOne({ puid }).exec();
      if (response) return Helpers.success(response);

      return Helpers.fail('Sale not found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getMySales(
    page: number,
    authenticatedUser: User,
    type,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const query = {} as any;
      if (authenticatedUser.role === UserRole.USER) {
        query.createdById = authenticatedUser.uuid;
      } else {
        if (authenticatedUser.accountType === AccountType.BUSINESS) {
          query.businessId = authenticatedUser.businessId;
        }
      }

      if (
        status &&
        Object.values(Status).includes(status.toUpperCase() as Status)
      ) {
        query.status = status.toUpperCase();
      }

      if (type != null && type !== undefined) {
        query.type = type;
      }

      const size = 20;
      const skip = page || 0;

      const count = await this.sale.count(query);
      const result = await this.sale
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

      return Helpers.fail('No Sale found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchMySales(
    page: number,
    authenticatedUser: User,
    type,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const query = { $text: { $search: searchString } } as any;
      if (authenticatedUser.role === UserRole.USER) {
        query.createdById = authenticatedUser.uuid;
      } else {
        if (authenticatedUser.accountType === AccountType.BUSINESS) {
          query.businessId = authenticatedUser.businessId;
        }
      }

      const size = 20;
      const skip = page || 0;

      if (type != null && type !== undefined) {
        query.type = type;
      }

      const count = await this.sale.count(query);
      const result = await this.sale
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

      return Helpers.fail('No Sale found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
