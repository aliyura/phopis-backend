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

@Injectable()
export class BusinessTypeService {
  constructor(
    @InjectModel(BusinessType.name)
    private businessType: Model<BusinessTypeDocument>,
  ) {}

  async createBusinessType(requestDto: BusinessTypeDto): Promise<BusinessType> {
    const request = {
      ...requestDto,
      status: Status.ACTIVE,
      businessTypeId: `BTI${Helpers.getUniqueId()}`,
    } as BusinessType;

    return (await this.businessType.create(request)).save();
  }

  async findBusinessType(type: string): Promise<BusinessType> {
    return await this.businessType.findOne({ title: type }).exec();
  }

  async allBusinessType(): Promise<BusinessType> {
    return await this.businessType.findOne().exec();
  }
}
