import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  purchasePrice: number;

  @Prop({ required: true })
  sellingPrice: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  initialQuantity: number;

  @Prop({ required: true })
  size: string;

  @Prop()
  description: string;

  @Prop({ required: true, nique: true })
  code: number;

  @Prop({ required: true, unique: true })
  puid: string;

  @Prop({ required: true })
  createdById: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  businessId: string;

  @Prop()
  statusChangeHistory: any[];

  @Prop()
  updateHistory: any[];

  @Prop({ required: true })
  status: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product).index({
  '$**': 'text',
});
