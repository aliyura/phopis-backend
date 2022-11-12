import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  charges: number;

  @Prop({ required: true })
  revenue: number;

  @Prop()
  description: string;

  @Prop({ required: true, nique: true })
  code: number;

  @Prop({ required: true, unique: true })
  suid: string;

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

export const ServiceSchema = SchemaFactory.createForClass(Service).index({
  '$**': 'text',
});
