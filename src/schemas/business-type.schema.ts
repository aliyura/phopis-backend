import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessTypeDocument = BusinessType & Document;

@Schema({ timestamps: true })
export class BusinessType {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  businessTypeId: string;
}

export const BusinessTypeSchema = SchemaFactory.createForClass(BusinessType);
