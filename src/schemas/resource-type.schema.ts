import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResourceTypeDocument = ResourceType & Document;

@Schema({ timestamps: true })
export class ResourceType {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  rtuid: string;
}

export const ResourceTypeSchema = SchemaFactory.createForClass(ResourceType);
