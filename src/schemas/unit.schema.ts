import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UnitDocument = Unit & Document;

@Schema({ timestamps: true })
export class Unit {
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

export const UnitSchema = SchemaFactory.createForClass(Unit);
