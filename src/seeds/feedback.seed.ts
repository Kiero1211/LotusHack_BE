import { Model, Types } from 'mongoose';
import { Feedback } from 'src/modules/feedbacks/schemas/feedback.schema';
import { CHAT_IDS } from './chat.seed';

export const FEEDBACK_IDS = {
  alicePhotosynthesisFeedback: new Types.ObjectId('64e1f2a3b4c5d6e7f8a9b001'),
  carolMLFeedback: new Types.ObjectId('64e1f2a3b4c5d6e7f8a9b002'),
};

export async function seedFeedbacks(feedbackModel: Model<Feedback>): Promise<void> {
  const feedbacks = [
    {
      _id: FEEDBACK_IDS.alicePhotosynthesisFeedback,
      chatId: CHAT_IDS.alicePhotosynthesisChat,
      masteryScore: 92,
      missedConcepts: [
        'The role of the electron transport chain in the light reactions',
        'The specific products of Photosystem I vs Photosystem II',
      ],
      strengthsHighlighted: [
        'Clearly explained the two main stages of photosynthesis',
        'Correctly stated the overall chemical equation',
        'Identified the locations of each stage (thylakoid and stroma)',
      ],
      gentleSuggestions: [
        'Try to elaborate on how ATP synthase generates ATP during the light reactions',
        'Consider mentioning how the Calvin cycle is also known as the light-independent reaction',
      ],
    },
    {
      _id: FEEDBACK_IDS.carolMLFeedback,
      chatId: CHAT_IDS.carolMLChat,
      masteryScore: 88,
      missedConcepts: ['Bias-variance tradeoff', 'Specific regularization techniques (L1 vs L2)'],
      strengthsHighlighted: [
        'Correctly distinguished between supervised and unsupervised learning',
        'Provided clear real-world examples for each type',
        'Accurately explained the concept of overfitting and prevention strategies',
      ],
      gentleSuggestions: [
        'Consider explaining the bias-variance tradeoff as it relates to overfitting',
        'Mention semi-supervised learning as a fourth paradigm alongside the three main types',
      ],
    },
  ];

  await feedbackModel.deleteMany({});

  // Drop stale indexes that no longer match the current schema
  const collection = feedbackModel.collection;
  const indexes = await collection.indexes();
  for (const index of indexes) {
    if (index.name !== '_id_') {
      await collection.dropIndex(index.name as string);
    }
  }

  await feedbackModel.insertMany(feedbacks);
  console.log(`Seeded ${feedbacks.length} feedbacks`);
}
