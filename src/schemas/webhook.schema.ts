import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebhookDocument = Webhook & Document;

@Schema({ timestamps: true })
export class Webhook {
  @Prop({ type: Types.ObjectId })
  id: string;
  payload: any;
  status: string;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);
