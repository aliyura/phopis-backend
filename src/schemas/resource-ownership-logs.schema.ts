import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  CartonDetailDto,
  ResourceStatusUpdateDto,
  ResourceOwnershipProofDto,
  ResourceLocationDetailDto,
} from '../dtos/resource.dto';

export type ResourceOwnershipLogDocument = ResourceOwnershipLog & Document;

@Schema({ timestamps: true })
export class ResourceOwnershipLog {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  ownerUuid: string;

  @Prop({ required: true })
  newOwnerName: string;

  @Prop({ required: true })
  newOwnerUuid: string;

  @Prop({ required: true })
  code: number;

  @Prop({ required: true })
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

  @Prop()
  type: string;

  @Prop()
  picture: string;

  @Prop()
  ownershipHistory: any[];

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
  releasedDate: string;

  @Prop()
  statusChangeHistory: any[];

  @Prop()
  lastStatusChange: ResourceStatusUpdateDto;

  @Prop({ required: true })
  status: string;

  @Prop()
  lastOwnershipChangeDate: string;
}

export const ResourceOwnershipLogSchema =
  SchemaFactory.createForClass(ResourceOwnershipLog);
