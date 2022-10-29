import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductSizeDocument = ProductSize & Document;

@Schema({ timestamps: true })
export class ProductSize {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true, unique: true })
  title: string;

  @Prop({ required: true })
  status: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  psuid: string;
}

export const ProductSizeSchema = SchemaFactory.createForClass(ProductSize);
