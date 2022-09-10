import { Injectable } from '@nestjs/common';
import { Status } from 'src/enums';
import { BusinessDto } from '../../dtos/business.dto';
import { Business, BusinessDocument } from '../../schemas/business.schema';
import { Helpers } from '../../helpers/utitlity.helpers';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name)
    private business: Model<BusinessDocument>,
  ) {}

  async createBusiness(requestDto: BusinessDto): Promise<Business> {
//    return (await this.business.deleteMany().exec());

    const request = {
      ...requestDto,
      status: Status.INACTIVE,
      businessId:
        requestDto.businessId != '' && requestDto.businessId != ''
          ? requestDto.businessId
          : `BTI${Helpers.getUniqueId()}`,
    } as Business;

    return (await this.business.create(request)).save();
  }

  async newBusiness(requestDto: BusinessDto): Promise<Business> {
    return null;
  }
  async existByPhoneOrEmail(email: string, phone: string): Promise<boolean> {
    {
      const res = await this.business
        .findOne({
          $or: [{ phone, email }],
        })
        .exec();

      if (res) return true;
      return false;
    }
  }

  async businessExist(businessName: string): Promise<boolean> {
    {
      const res = await this.business.findOne({ name: businessName }).exec();

      if (res) return true;
      return false;
    }
  }
}
