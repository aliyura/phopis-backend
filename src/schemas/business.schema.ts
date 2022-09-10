import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessDocument = Business & Document;

@Schema({ timestamps: true })
export class Business {
  @Prop({ type: Types.ObjectId })
  id: string;
 
  @Prop({ required: true })
  businessName: string;

  @Prop({ unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;
 
  @Prop()
  state: string;

  @Prop()
  lga: string;

  @Prop()
  address: string;

  @Prop({ required: true })
  identityType: string;

  @Prop({ required: true })
  identityNumber: string;

  @Prop({ required: true })
  status: string;
 
  @Prop({ required: true })
  businessId: string;

  @Prop({ required: true })
  logo: string;

  // @Prop()
  // regNumber: string;
}

export const UserSchema = SchemaFactory.createForClass(Business);
