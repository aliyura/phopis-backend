import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AdditionalInfoDto } from '../dtos/user.dto';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  uuid: string;

  @Prop()
  businessId: string;

  @Prop()
  business: string;

  @Prop()
  branchId: string;

  @Prop()
  branch: string;

  @Prop({ required: true, unique: true })
  code: number;

  @Prop()
  businessType: string;

  @Prop()
  state: string;

  @Prop()
  lga: string;

  @Prop()
  pin: string;

  @Prop()
  address: string;

  @Prop()
  unitAddress: string;

  @Prop()
  unitCode: string;

  @Prop()
  nin: string;

  @Prop()
  dp: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  accountType: string;

  @Prop()
  businessTarget: string;

  @Prop()
  regNumber: string;

  @Prop({ unique: true })
  alias: string;

  @Prop()
  referee: number;

  @Prop()
  additionalInfo: AdditionalInfoDto;

  @Prop()
  subscriptionHistory: any[];
}

export const UserSchema = SchemaFactory.createForClass(User).index({
  '$**': 'text',
});
