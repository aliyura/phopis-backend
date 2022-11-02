import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductTypeDocument = ProductType & Document;

@Schema({ timestamps: true })
export class ProductType {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true, unique: true })
  title: string;

  @Prop({ required: true })
  status: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  ptuid: string;

  @Prop({ required: true })
  businessId: string;
}

export const ProductTypeSchema = SchemaFactory.createForClass(ProductType);
