import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from 'src/dtos/ApiResponse.dto';
import { Status } from 'src/enums';
import { Helpers } from 'src/helpers';
import { ProductTypeDto } from '../../dtos/product-type.dto';
import { Model } from 'mongoose';
import {
  ProductType,
  ProductTypeDocument,
} from '../../schemas/product-type.schema';
import { Messages } from 'src/utils/messages/messages';

@Injectable()
export class ProductTypeService {
  constructor(
    @InjectModel(ProductType.name)
    private resourceType: Model<ProductTypeDocument>,
  ) {}

  async createProductType(requestDto: ProductTypeDto): Promise<ApiResponse> {
    try {
      const response = await this.resourceType
        .findOne({ title: requestDto.title })
        .exec();

      if (response) return Helpers.fail('Product type already exist');

      let title = requestDto.title.replace('\\s', '_');
      title = title.toUpperCase();
      requestDto.title = title;

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        ptuid: `pt${Helpers.getUniqueId()}`,
      } as ProductType;

      const saved = await this.resourceType.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async updateProductType(
    id: string,
    requestDto: ProductTypeDto,
  ): Promise<ApiResponse> {
    try {
      const response = await this.resourceType
        .findOne({ resourceTypeId: id })
        .exec();

      if (!response) return Helpers.fail(Messages.ProductTypeNotFound);

      const saved = await this.resourceType.updateOne(
        { resourceTypeId: id },
        { $set: requestDto },
      );
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteProductType(ptuid: string): Promise<ApiResponse> {
    try {
      const response = await this.resourceType.deleteOne({ ptuid }).exec();
      return Helpers.success(response);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findProductType(ptuid: string): Promise<ApiResponse> {
    try {
      const req = await this.resourceType.findOne({ ptuid });
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ProductTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async allProductType(): Promise<ApiResponse> {
    try {
      const req = await this.resourceType.find();
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.ProductTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
