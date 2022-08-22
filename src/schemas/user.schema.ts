import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  state: string;

  @Prop()
  lga: string;

  @Prop()
  address: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  target: string;

  @Prop({ required: true })
  businessId: string;

  @Prop()
  regNumber: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
