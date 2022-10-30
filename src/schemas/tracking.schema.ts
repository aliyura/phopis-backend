import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TrackingDocument = Tracking & Document;

@Schema({ timestamps: true })
export class Tracking {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  resourceId: string;

  @Prop({ required: true })
  resourceName: string;

  @Prop({ required: true })
  resourceIdentityNumber: string;

  @Prop({ required: true })
  resourceType: string;

  @Prop({ required: true })
  missingReason: string;

  @Prop({ required: true })
  missingDate: string;

  @Prop({ required: true })
  missingArea: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, nique: true })
  code: number;

  @Prop({ required: true, unique: true })
  truid: string;

  @Prop({ required: true })
  uuid: string;

  @Prop()
  statusChangeHistory: any[];

  @Prop({ required: true })
  status: string;
}

export const TrackingSchema = SchemaFactory.createForClass(Tracking).index({
  '$**': 'text',
});
