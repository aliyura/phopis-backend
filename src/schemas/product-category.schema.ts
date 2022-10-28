import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductCategoryDocument = ProductCategory & Document;

@Schema({ timestamps: true })
export class ProductCategory {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  pcuid: string;
}

export const ProductCategorySchema =
  SchemaFactory.createForClass(ProductCategory);
