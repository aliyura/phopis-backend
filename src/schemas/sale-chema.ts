import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleDocument = Sale & Document;

@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  customerAccountCode: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerPhoneNumber: string;

  @Prop({ required: true })
  products: any[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  createdById: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true, unique: true })
  code: number;

  @Prop()
  totalDiscount: number;

  @Prop({ required: true, unique: true })
  suid: string;
}

export const SaleSchema = SchemaFactory.createForClass(Sale).index({
  '$**': 'text',
});
