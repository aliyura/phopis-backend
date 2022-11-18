import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Status } from 'src/enums';
import { Helpers } from 'src/helpers';
import { ProductCategoryDto } from '../../dtos/product-category.dto';
import { Model } from 'mongoose';
import {
  ProductCategory,
  ProductCategoryDocument,
} from '../../schemas/product-category.schema';
import { Messages } from 'src/utils/messages/messages';
import { AccountType } from '../../enums/enums';
import { User } from '../../schemas/user.schema';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectModel(ProductCategory.name)
    private productCategory: Model<ProductCategoryDocument>,
  ) {}

  async createProductCategory(
    authenticatedUser: User,
    requestDto: ProductCategoryDto,
  ): Promise<ApiResponse> {
    try {
      if (authenticatedUser.accountType === AccountType.INDIVIDUAL)
        return Helpers.fail(Messages.NoPermission);

      let title = requestDto.title.replace('\\s', '_');
      title = title.toUpperCase();
      requestDto.title = title;

      const response = await this.productCategory
        .findOne({ title: requestDto.title })
        .exec();

      if (response) return Helpers.fail('Product category already exist');

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        pcuid: `pc${Helpers.getUniqueId()}`,
      } as ProductCategory;

      const saved = await this.productCategory.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateProductCategory(
    pcuid: string,
    requestDto: ProductCategoryDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.productCategory
        .findOne({ pcuid: pcuid })
        .exec();

      if (!response) return Helpers.fail('Product category not found');

      const saved = await this.productCategory.updateOne(
        { pcuid: pcuid },
        { $set: requestDto },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteProductCategory(pcuid: string): Promise<ApiResponse> {
    try {
      const response = await this.productCategory.deleteOne({ pcuid }).exec();
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async allProductCategory(): Promise<ApiResponse> {
    try {
      const req = await this.productCategory.find();
      if (req.length) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ProductCategoryNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
