import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceTypeDocument = ServiceType & Document;

@Schema({ timestamps: true })
export class ServiceType {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true, unique: true })
  title: string;

  @Prop({ required: true })
  status: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  stuid: string;

  @Prop({ required: true })
  businessId: string;
}

export const ServiceTypeSchema = SchemaFactory.createForClass(ServiceType);
