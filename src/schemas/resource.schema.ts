import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  CartonDetailDto,
  ResourceStatusUpdateDto,
  ResourceOwnershipProofDto,
  ResourceLocationDetailDto,
} from '../dtos/resource.dto';

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  currentOwnerUuid: string;

  @Prop()
  prevOwnerUuid: string;

  @Prop({ required: true, nique: true })
  code: number;

  @Prop({ required: true, unique: true })
  ruid: string;

  @Prop()
  model: string;

  @Prop()
  color: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  identityNumber: string;

  @Prop()
  carton: boolean;

  @Prop()
  cartonDetail: CartonDetailDto;

  @Prop()
  statusChangeDetail: ResourceStatusUpdateDto;

  @Prop({ required: true })
  type: string;

  @Prop()
  picture: string;

  @Prop()
  ownershipHistory: any[];

  @Prop()
  verificationHistory: any[];

  @Prop()
  updateHistory: any[];

  @Prop()
  ownershipProof: ResourceOwnershipProofDto;

  @Prop()
  size: string;

  @Prop()
  locationDetail: ResourceLocationDetailDto;

  @Prop()
  witnesses: any[];

  @Prop()
  ownedDate: string;

  @Prop()
  statusChangeHistory: any[];

  @Prop()
  lastStatusChange: ResourceStatusUpdateDto;

  @Prop({ required: true })
  status: string;

  @Prop()
  lastOwnershipChangeDate: string;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource).index({
  '$**': 'text',
});
