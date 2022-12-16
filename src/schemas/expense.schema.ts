import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, unique: true })
  code: number;

  @Prop({ required: true, unique: true })
  euid: string;

  @Prop()
  expenseDate: string;

  @Prop({ required: true })
  createdById: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  businessId: string;

  @Prop()
  updateHistory: any[];
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense).index({
  '$**': 'text',
});
