import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleDocument = Sale & Document;

@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  customerAccountCode: string;

  @Prop()
  customerName: string;

  @Prop()
  customerPhoneNumber: string;

  @Prop({ required: true })
  items: any[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  totalRevenue: number;

  @Prop()
  totalDiscount: number;

  @Prop({ required: true })
  createdById: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  businessId: string;

  @Prop({ required: true, unique: true })
  code: number;

  @Prop({ required: true, unique: true })
  suid: string;
}

export const SaleSchema = SchemaFactory.createForClass(Sale).index({
  '$**': 'text',
});
