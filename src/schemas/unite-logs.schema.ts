import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UnitLogDocument = UnitLog & Document;

@Schema({ timestamps: true })
export class UnitLog {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  uuid: string;

  @Prop({ required: true })
  activity: string;

  @Prop()
  address: string;

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

export const UnitLogSchema = SchemaFactory.createForClass(UnitLog).index({
  '$**': 'text',
});
