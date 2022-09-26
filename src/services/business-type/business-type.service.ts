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

      if (response) return Helpers.no('Business Type Already Exist');

      const request = {
        ...requestDto,
        status: Status.ACTIVE,
        businessTypeId: `BTI${Helpers.getUniqueId()}`,
      } as BusinessType;

      const saved = await this.businessType.create(request);
      return Helpers.yes(saved);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async findBusinessType(type: string): Promise<ApiResponse> {
    try {
      const req = await this.businessType.findOne({ businessTypeId: type });
      if (req) {
        return Helpers.yes(req);
      }
      return Helpers.no(Messages.BusinessTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }

  async allBusinessType(): Promise<ApiResponse> {
    try {
      const req = await this.businessType.find();
      if (req) {
        return Helpers.yes(req);
      }
      return Helpers.no(Messages.BusinessTypeNotFound);
    } catch (ex) {
      console.log(Messages.ErrorOccurred, ex);
      return Helpers.no(Messages.Exception);
    }
  }
}
