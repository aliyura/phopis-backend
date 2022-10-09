import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true, unique: true })
  uuid: string;

  @Prop({ required: true, unique: true })
  userCode: string;

  @Prop({ required: true, unique: true })
  address: string;

  @Prop({ required: true, unique: true })
  code: number;

  @Prop()
  balance: number;

  @Prop()
  prevBalance: number;

  @Prop({ required: true })
  status: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
