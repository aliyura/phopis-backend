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

  async updateUser(stamp: string, user: User): Promise<any> {
    return await this.user.updateOne({ stamp }, user);
  }

  async findByStamp(stamp: string): Promise<User> {
    return await this.user.findOne({ stamp }).exec();
  }
  async findByPhone(phone: string): Promise<User> {
    return await this.user.findOne({ phone }).exec();
  }
  async findByEmail(email: string): Promise<User> {
    return await this.user.findOne({ email }).exec();
  }
  async findByPhoneOrEmail(phone: string, email: string): Promise<User> {
    return await this.user
      .findOne({
        $or: [{ phone, email }],
      })
      .exec();
  }
  async existByPhoneOrEmail(phone: string, email: string): Promise<Boolean> {
    const res = await this.user
      .findOne({
        $or: [{ phone, email }],
      })
      .exec();

    if (res) return true;
    return false;
  }
}
