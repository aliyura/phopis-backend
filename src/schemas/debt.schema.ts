import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DebtDocument = Debt & Document;

@Schema({ timestamps: true })
export class Debt {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  clearedAmount: number;

  @Prop({ required: true })
  debtorName: string;

  @Prop({ required: true })
  debtorPhoneNumber: string;

  @Prop()
  description: string;

  @Prop({ required: true, unique: true })
  code: number;

  @Prop({ required: true, unique: true })
  duid: string;

  @Prop()
  repaymentDate: string;

  @Prop()
  lastPaidDate: string;

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

export const DebtSchema = SchemaFactory.createForClass(Debt).index({
  '$**': 'text',
});
