import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CattonDetailDto, ResourceStatusUpdateDto } from '../dtos/resource.dto';

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ type: Types.ObjectId })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  currentOwnerUuid: string;

  @Prop()
  prevOwnerUuid: string;

  @Prop({ required: true, nique: true })
  code: string;

  @Prop({ required: true, unique: true })
  ruid: string;

  @Prop({ required: true })
  model: string;

  @Prop()
  color: string;

  @Prop()
  description: string;

  @Prop()
  identityNumber: string;

  @Prop()
  catton: boolean;

  @Prop()
  cattonDetail: CattonDetailDto;

  @Prop()
  missingDetail: ResourceStatusUpdateDto;

  @Prop()
  type: string;

  @Prop()
  picture: string;

  @Prop()
  ownershipHistory: any[];

  @Prop()
  statusChangeHistory: any[];

  @Prop()
  lastStatusChange: ResourceStatusUpdateDto;

  @Prop({ required: true })
  status: string;

  @Prop()
  lastOwnershipChangeDate: string;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
