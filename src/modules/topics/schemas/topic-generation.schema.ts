import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument } from 'mongoose';

export enum TopicGenerationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ _id: false })
export class GeneratedTopicItem {
  @Prop({ required: true })
  topicId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ required: true })
  description: string;
}

@Schema({ _id: false })
export class QueuedDocumentItem {
  @Prop({ required: true })
  documentId: string;

  @Prop({ required: true })
  title: string;
}

@Schema({ timestamps: true })
export class TopicGeneration extends MongooseDocument {
  @Prop({ required: true, index: true })
  teachingSessionId: string;

  @Prop({ type: String, default: null })
  sourceDocumentId: string | null;

  @Prop({ type: [QueuedDocumentItem], default: [] })
  queuedDocuments: QueuedDocumentItem[];

  @Prop({ type: String, enum: TopicGenerationStatus, default: TopicGenerationStatus.PENDING })
  status: TopicGenerationStatus;

  @Prop({ type: [GeneratedTopicItem], default: [] })
  topics: GeneratedTopicItem[];

  @Prop({ type: String, default: null })
  errorMessage: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TopicGenerationSchema = SchemaFactory.createForClass(TopicGeneration);
