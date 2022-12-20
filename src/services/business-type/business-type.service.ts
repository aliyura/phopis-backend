import { Injectable } from '@nestjs/common';
import { Status } from 'src/enums';
import { BusinessTypeDto } from '../../dtos/business-type.dto';
import {
  BusinessType,
  BusinessTypeDocument,
} from '../../schemas/business-type.schema';
import { Helpers } from '../../helpers/utitlity.helpers';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ApiResponse } from '../../dtos/ApiResponse.dto';
import { Messages } from 'src/utils/messages/messages';

@Injectable()
export class BusinessTypeService {
  constructor(
    @InjectModel(BusinessType.name)
    private businessType: Model<BusinessTypeDocument>,
  ) {}

  async createBusinessType(requestDto: BusinessTypeDto): Promise<ApiResponse> {
    try {
      const response = await this.businessType
        .findOne({ title: requestDto.title })
        .exec();

      if (response) return Helpers.fail('Business Type Already Exist');

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        btuid: `bt${Helpers.getUniqueId()}`,
      } as BusinessType;

      const saved = await this.businessType.create(request);
      return Helpers.success(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async deleteBusinessType(btuid: string): Promise<ApiResponse> {
    try {
      const req = await this.businessType.deleteOne({ btuid });
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.BusinessTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async findBusinessType(btuid: string): Promise<ApiResponse> {
    try {
      const req = await this.businessType.findOne({ btuid });
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.BusinessTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }

  async allBusinessType(): Promise<ApiResponse> {
    try {
      const req = await this.businessType.find();
      if (req) {
        return Helpers.success(req);
      }
      return Helpers.fail(Messages.BusinessTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.fail(Messages.Exception);
    }
  }
}
