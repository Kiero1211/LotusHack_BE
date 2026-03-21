import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document as MongooseDocument, Types } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

@Schema({ timestamps: true })
export class Feedback extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true, unique: true })
  chatId: Types.ObjectId;

  @Prop({ type: String, enum: ['vi', 'en'], default: 'vi' })
  locale: 'vi' | 'en';

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  masteryScore: number;

  @Prop({ type: [String], default: [] })
  missedConcepts: string[];

  @Prop({ type: [String], default: [] })
  strengthsHighlighted: string[];

  @Prop({ type: [String], default: [] })
  gentleSuggestions: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
