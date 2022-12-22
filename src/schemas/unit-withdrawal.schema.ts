import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UnitWithdrawalDocument = UnitWithdrawal & Document;

@Schema({ timestamps: true })
export class UnitWithdrawal {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true, unique: true })
  uuid: string;

  @Prop({ required: true })
  unitId: string;

  @Prop({ required: true })
  requestId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  accountName: string;

  @Prop({ required: true })
  accountType: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  status: string;

  @Prop()
  statusReason: string;
}

export const UnitWithdrawalSchema =
  SchemaFactory.createForClass(UnitWithdrawal);
