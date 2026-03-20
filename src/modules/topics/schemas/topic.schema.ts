import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types, HydratedDocument } from 'mongoose';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({ timestamps: true })
export class Topic extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Document', required: true })
  documentId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: Number, required: true })
  phase: number;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
