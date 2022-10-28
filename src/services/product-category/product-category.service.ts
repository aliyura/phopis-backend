import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Status } from 'src/enums';
import { Helpers } from 'src/helpers';
import { ProductCategoryDto } from '../../dtos/resource-category.dto';
import { Model } from 'mongoose';
import {
  ProductCategory,
  ProductCategoryDocument,
} from '../../schemas/product-category.schema';
import { Messages } from 'src/utils/messages/messages';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectModel(ProductCategory.name)
    private productCategory: Model<ProductCategoryDocument>,
  ) {}

  async createProductCategory(
    requestDto: ProductCategoryDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.productCategory
        .findOne({ title: requestDto.title })
        .exec();

      if (response) return Helpers.fail('Product category already exist');

      let title = requestDto.title.replace('\\s', '_');
      title = title.toUpperCase();
      requestDto.title = title;

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
    id: string,
    requestDto: ProductCategoryDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.productCategory
        .findOne({ productCategoryId: id })
        .exec();

      if (!response) return Helpers.fail('Product type not found');

      const saved = await this.productCategory.updateOne(
        { productCategoryId: id },
        { $set: requestDto },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteProductCategory(rcuid: string): Promise<ApiResponse> {
    try {
      const response = await this.productCategory.deleteOne({ rcuid }).exec();
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
