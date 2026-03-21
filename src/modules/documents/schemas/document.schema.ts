import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument } from 'mongoose';

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Document extends MongooseDocument {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  originFileName: string;

  @Prop({ required: true })
  batchId: string;

  @Prop({ required: true, index: true })
  teachingSessionId: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true, enum: DocumentStatus, default: DocumentStatus.PENDING })
  status: DocumentStatus;

  @Prop({ type: String, default: null })
  processedText: string;

  @Prop({ type: String, default: null })
  errorMessage: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
