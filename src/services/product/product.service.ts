import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Helpers } from 'src/helpers';
import { ProductDocument, Product } from '../../schemas/product.schema';
import { UserDocument, User } from 'src/schemas/user.schema';
import { Status } from 'src/enums';
import { Messages } from 'src/utils/messages/messages';
import { ActionType, AccountType, UserRole } from '../../enums/enums';
import { ProductUploadDto } from '../../dtos/product.dto';
import {
  ProductSize,
  ProductSizeDocument,
} from '../../schemas/product-size.schema';
import {
  ProductTypeDocument,
  ProductType,
} from '../../schemas/product-type.schema';
import {
  ProductCategoryDocument,
  ProductCategory,
} from '../../schemas/product-category.schema';
import {
  ProductDto,
  UpdateProductDto,
  ProductAdjustDto,
} from '../../dtos/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private product: Model<ProductDocument>,
    @InjectModel(User.name) private user: Model<UserDocument>,
    @InjectModel(ProductType.name)
    private productType: Model<ProductTypeDocument>,
    @InjectModel(ProductCategory.name)
    private category: Model<ProductCategoryDocument>,
    @InjectModel(ProductSize.name)
    private productSize: Model<ProductSizeDocument>,
  ) {}
  async createProduct(
    authenticatedUser: User,
    requestDto: ProductDto,
  ): Promise<ApiResponse> {
    try {
      const productExistByTitle = await this.product.findOne({
        title: requestDto.title,
        businessId: authenticatedUser.businessId,
      });
      if (productExistByTitle) return Helpers.fail('Product  already exist');

      const typeExist = await this.productType.findOne({
        title: requestDto.type,
      });
      if (!typeExist) return Helpers.fail('Product type not exist');

      const sizeExist = await this.productSize.findOne({
        title: requestDto.size,
      });
      if (!sizeExist) return Helpers.fail('Product size does not exist');

      if (!requestDto.quantity || requestDto.quantity <= 0)
        requestDto.quantity = 0;

      if (!requestDto.sellingPrice || requestDto.sellingPrice <= 0)
        return Helpers.fail('Product selling price required');

      if (authenticatedUser.role != UserRole.BUSINESS)
        return Helpers.fail(Messages.NoPermission);

      let quantityBased = false;
      const code = Helpers.getCode();
      const productId = `pro${Helpers.getUniqueId()}`;
      const businessId = authenticatedUser.businessId || authenticatedUser.uuid;

      if (requestDto.quantity && Number(requestDto.quantity) > 0)
        quantityBased = true;
      const status = quantityBased ? Status.AVAILABLE : Status.ACTIVE;

      const request = {
        ...requestDto,
        quantityBased,
        category: typeExist.category,
        initialQuantity: quantityBased ? requestDto.quantity : 0,
        status: status,
        code: code,
        puid: productId,
        businessId: businessId,
        createdBy: authenticatedUser.name,
        createdById: authenticatedUser.uuid,
      } as Product;
      const saved = await (await this.product.create(request)).save();
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateProduct(
    authenticatedUser: User,
    puid: string,
    requestDto: UpdateProductDto,
  ): Promise<ApiResponse> {
    try {
      const existingProduct = await this.product.findOne({
        puid,
      });
      if (!existingProduct) return Helpers.fail('Product not found');

      const request = {
        ...requestDto,
      };

      const updateHistory = {
        ...requestDto,
        actionType: ActionType.UPDATE,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };

      const updated = await this.product.updateOne(
        { puid, businessId: authenticatedUser.businessId },
        {
          $set: request,
          $push: {
            updateHistory: updateHistory,
          },
        },
        { upsert: true },
      );

      return Helpers.success(updated);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async adjustProduct(
    authenticatedUser: User,
    puid: string,
    requestDto: ProductAdjustDto,
  ): Promise<ApiResponse> {
    try {
      const existingProduct = await this.product.findOne({
        puid,
        businessId: authenticatedUser.businessId,
      });

      if (!existingProduct) return Helpers.fail('Product not found');

      let quantity = existingProduct.quantity;
      let initialQuantity = existingProduct.initialQuantity;

      if (requestDto.operation.toUpperCase() === 'ADD') {
        quantity += requestDto.quantity;
        initialQuantity += requestDto.quantity;
      } else if (requestDto.operation.toUpperCase() === 'REMOVE') {
        if (quantity - requestDto.quantity > 0) quantity -= requestDto.quantity;
        else quantity = 0;
      } else {
        return Helpers.fail('Operation not recognized, use ADD or REMOVE');
      }

      const status = quantity > 0 ? Status.AVAILABLE : Status.UNAVAILABLE;
      const request = {
        quantity,
        initialQuantity,
        status,
        quantityBased: initialQuantity > 0 ? true : false,
      };
      const updateHistory = {
        ...requestDto,
        actionType: ActionType.ADJUSTMENT,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };

      const updated = await this.product.updateOne(
        { puid, businessId: authenticatedUser.businessId },
        {
          $set: request,
          $push: {
            updateHistory: updateHistory,
          },
        },
        { upsert: true },
      );

      return Helpers.success(updated);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async uploadProduct(
    authenticatedUser: User,
    puid: string,
    requestDto: ProductUploadDto,
  ): Promise<ApiResponse> {
    try {
      const existingProduct = await this.product.findOne({
        puid,
      });

      if (!existingProduct)
        return Helpers.fail('Product not found, please create it');

      let quantity = existingProduct.quantity;
      let initialQuantity = existingProduct.initialQuantity;

      quantity += requestDto.quantity;
      initialQuantity += requestDto.quantity;

      const status = quantity > 0 ? Status.AVAILABLE : Status.UNAVAILABLE;

      const request = {
        initialQuantity,
        quantity,
        quantityBased: quantity > 0 ? true : false,
        status,
      };
      const updateHistory = {
        ...requestDto,
        actionType: ActionType.UPLOAD,
        actionDate: new Date(),
        actionBy: authenticatedUser.uuid,
        actionByUser: authenticatedUser.name,
      };

      await this.product.updateOne(
        { puid, uuid: authenticatedUser.uuid },
        {
          $set: request,
          $push: {
            updateHistory: updateHistory,
          },
        },
        { upsert: true },
      );
      return Helpers.success(await this.product.findOne({ puid }));
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteProduct(
    authenticatedUser: User,
    puid: string,
  ): Promise<ApiResponse> {
    try {
      const response = await this.product.deleteOne({
        puid,
      });
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async getMyProducts(
    page: number,
    authenticatedUser: User,
    status: string,
  ): Promise<ApiResponse> {
    try {
      const query = {} as any;

      if (authenticatedUser.accountType === AccountType.INDIVIDUAL)
        return Helpers.fail(Messages.NoPermission);

      if (authenticatedUser.accountType !== AccountType.ADMIN) {
        query.businessId =
          authenticatedUser.businessId || authenticatedUser.uuid;
      }

      if (
        status &&
        Object.values(Status).includes(status.toUpperCase() as Status)
      ) {
        query.status = status.toUpperCase();
      }

      console.log(query);

      const size = 20;
      const skip = page || 0;

      const count = await this.product.count(query);
      const result = await this.product
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

      return Helpers.fail('No Product found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async searchMyProducts(
    page: number,
    authenticatedUser: User,
    searchString: string,
  ): Promise<ApiResponse> {
    try {
      const query = {
        $text: { $search: searchString },
      } as any;

      if (authenticatedUser.accountType === AccountType.INDIVIDUAL)
        return Helpers.fail(Messages.NoPermission);

      if (authenticatedUser.accountType !== AccountType.ADMIN) {
        query.businessId =
          authenticatedUser.businessId || authenticatedUser.uuid;
      }

      const size = 20;
      const skip = page || 0;

      console.log(query);

      const count = await this.product.count(query);
      const result = await this.product
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

      return Helpers.fail('No Product found');
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
