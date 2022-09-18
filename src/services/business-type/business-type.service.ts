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

@Injectable()
export class BusinessTypeService {
  constructor(
    @InjectModel(BusinessType.name)
    private businessType: Model<BusinessTypeDocument>,
  ) {}

  async createBusinessType(requestDto: BusinessTypeDto): Promise<ApiResponse> {
    const response = await this.businessType
      .findOne({ title: requestDto.title })
      .exec();

    if (response)
      return Helpers.error('Business Type Already Exist', 'BAD_REQUEST');

    const request = {
      ...requestDto,
      status: Status.ACTIVE,
      businessTypeId: `BTI${Helpers.getUniqueId()}`,
    } as BusinessType;

    const saved = (await this.businessType.create(request)).save();
    return Helpers.success(saved, 'Created Successfully');
  }

  async findBusinessType(type: string): Promise<ApiResponse> {
    const req = this.businessType.findOne({ title: type }).exec();
    if (req) {
      return Helpers.success(req, 'Request SUccessful');
    }
    return Helpers.error('Business type not found', 'NOT_FOUND');
  }

  async allBusinessType(): Promise<ApiResponse> {
    const req = await this.businessType.find().exec();
    if (req) {
      return Helpers.success(req, 'Request SUccessful');
    }
    return Helpers.error('Business types not found', 'NOT_FOUND');
  }
}
