import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Status } from 'src/enums';
import { Helpers } from 'src/helpers';
import { ProductSizeDto } from '../../dtos/product-size.dto';
import { Model } from 'mongoose';
import {
  ProductSize,
  ProductSizeDocument,
} from '../../schemas/product-size.schema';
import { Messages } from 'src/utils/messages/messages';

@Injectable()
export class ProductSizeService {
  constructor(
    @InjectModel(ProductSize.name)
    private productType: Model<ProductSizeDocument>,
  ) {}

  async createProductSize(requestDto: ProductSizeDto): Promise<ApiResponse> {
    try {
      const response = await this.productType
        .findOne({ title: requestDto.title })
        .exec();

      if (response) return Helpers.fail('Product size already exist');

      let title = requestDto.title.replace('\\s', '_');
      title = title.toUpperCase();
      requestDto.title = title;

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        psuid: `ps${Helpers.getUniqueId()}`,
      } as ProductSize;

      const saved = await this.productType.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateProductSize(
    id: string,
    requestDto: ProductSizeDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.productType
        .findOne({ productTypeId: id })
        .exec();

      if (!response) return Helpers.fail(Messages.ProductSizeNotFound);

      const saved = await this.productType.updateOne(
        { productTypeId: id },
        { $set: requestDto },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteProductSize(ptuid: string): Promise<ApiResponse> {
    try {
      const response = await this.productType.deleteOne({ ptuid }).exec();
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async allProductSize(): Promise<ApiResponse> {
    try {
      const req = await this.productType.find();
      if (req.length) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ProductSizeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
