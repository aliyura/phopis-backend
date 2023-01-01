import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WebhookDto } from '../dtos/webhook.dto';

export type WebhookDocument = Webhook & Document;

@Schema({ timestamps: true })
export class Webhook {
  @Prop({ type: Types.ObjectId })
  id: string;
  @Prop()
  payload: WebhookDto;
  @Prop()
  status: string;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);
