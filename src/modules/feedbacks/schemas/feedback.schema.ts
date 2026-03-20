import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document as MongooseDocument, Types } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

@Schema({ timestamps: true })
export class Feedback extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  masteryScore: number;

  @Prop({ type: [String], default: [] })
  missedConcepts: string[];

  @Prop({ type: [String], default: [] })
  strengthsHighlighted: string[];

  @Prop({ type: [String], default: [] })
  gentleSuggestions: string[];
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
