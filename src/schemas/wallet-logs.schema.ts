import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletLogDocument = WalletLog & Document;

@Schema({ timestamps: true })
export class WalletLog {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  uuid: string;

  @Prop({ required: true })
  activity: string;

  @Prop()
  sender: string;

  @Prop()
  recipient: string;

  @Prop()
  narration: string;

  @Prop({ required: true })
  ref: string;

  @Prop({ required: true })
  channel: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  status: string;
}

export const WalletLogSchema = SchemaFactory.createForClass(WalletLog);
