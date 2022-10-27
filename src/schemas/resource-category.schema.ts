import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResourceCategoryDocument = ResourceCategory & Document;

@Schema({ timestamps: true })
export class ResourceCategory {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  rcuid: string;
}

export const ResourceCategorySchema =
  SchemaFactory.createForClass(ResourceCategory);
