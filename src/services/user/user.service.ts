import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private user: Model<UserDocument>) {}

  async createUser(user: User): Promise<User> {
    return (await this.user.create(user)).save();
  }

  async updateUser(businessId: string, user: User): Promise<any> {
    return await this.user.updateOne({ businessId }, user);
  }

  async findByBusinessId(businessId: string): Promise<User> {
    return await this.user.findOne({ businessId }).exec();
  }
  async findByPhone(phone: string): Promise<User> {
    return await this.user.findOne({ phone }).exec();
  }
  async findByEmail(email: string): Promise<User> {
    return await this.user.findOne({ email }).exec();
  }
  async findByPhoneOrEmail(phone: string, email: string): Promise<User> {
    const emailUser = await this.user.findOne({ email }).exec();
    const phoneUser = await this.user.findOne({ phone }).exec();
    return emailUser ? emailUser : phoneUser;
  }
  async existByPhoneOrEmail(phone: string, email: string): Promise<boolean> {
    const res = await this.user
      .findOne({
        $or: [{ phone, email }],
      })
      .exec();

    if (res) return true;
    return false;
  }
}
