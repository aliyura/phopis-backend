import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  emailAddress: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  uuid: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  businessType: string;

  @Prop()
  state: string;

  @Prop()
  lga: string;

  @Prop()
  address: string;

  @Prop()
  nin: string;

  @Prop()
  dp: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  role: string;

  @Prop()
  businessTarget: string;

  @Prop()
  regNumber: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
