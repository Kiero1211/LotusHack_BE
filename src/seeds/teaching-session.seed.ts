import { Model, Types } from 'mongoose';
import { TeachingSession } from 'src/modules/teaching-sessions/schemas/teaching-session.schema';
import { USER_IDS } from './user.seed';

export const TEACHING_SESSION_IDS = {
  alicePhotosynthesis: new Types.ObjectId('64c1d2e3f4a5b6c7d8e9f001'),
  bobNewton: new Types.ObjectId('64c1d2e3f4a5b6c7d8e9f002'),
  carolML: new Types.ObjectId('64c1d2e3f4a5b6c7d8e9f003'),
};

export async function seedTeachingSessions(
  teachingSessionModel: Model<TeachingSession>,
): Promise<void> {
  const sessions = [
    {
      _id: TEACHING_SESSION_IDS.alicePhotosynthesis,
      userId: USER_IDS.alice,
      title: 'Photosynthesis Deep Dive',
      topic: 'Photosynthesis',
      sources: [
        {
          title: 'Biology Chapter 5 - Photosynthesis',
          content:
            'Photosynthesis occurs in the chloroplasts and involves two main stages: the light-dependent reactions and the Calvin cycle.',
          type: 'document',
        },
        {
          title: 'Khan Academy - Photosynthesis',
          content:
            'The light-dependent reactions take place in the thylakoid membranes, where chlorophyll absorbs sunlight to split water molecules.',
          type: 'web',
        },
      ],
      chatHistory: [
        {
          role: 'assistant',
          content: 'Please teach me about Photosynthesis based on your uploaded materials.',
          timestamp: new Date('2026-03-15T09:00:00Z'),
        },
        {
          role: 'user',
          content:
            'Photosynthesis is the process where plants use sunlight, water, and CO2 to produce glucose and oxygen. It happens in the chloroplasts.',
          timestamp: new Date('2026-03-15T09:01:30Z'),
        },
        {
          role: 'assistant',
          content: 'Excellent! Can you explain the two main stages and what happens in each?',
          timestamp: new Date('2026-03-15T09:02:00Z'),
        },
        {
          role: 'user',
          content:
            'The light-dependent reactions happen in the thylakoid membrane and produce ATP and NADPH. The Calvin cycle happens in the stroma and uses those products to fix CO2 into glucose.',
          timestamp: new Date('2026-03-15T09:03:00Z'),
        },
      ],
      summary:
        'Alice demonstrated strong understanding of the two stages of photosynthesis, correctly identifying their locations and main products. Minor gaps in electron transport chain details.',
    },
    {
      _id: TEACHING_SESSION_IDS.bobNewton,
      userId: USER_IDS.bob,
      title: "Newton's Laws Study Session",
      topic: "Newton's Laws of Motion",
      sources: [
        {
          title: 'Physics Lecture Notes',
          content:
            "Newton's three laws describe the relationship between forces and motion. The first law describes inertia, the second relates force to mass and acceleration (F=ma), and the third describes action-reaction pairs.",
          type: 'document',
        },
      ],
      chatHistory: [
        {
          role: 'assistant',
          content: "Let's explore Newton's Laws. Teach me what you know!",
          timestamp: new Date('2026-03-18T14:00:00Z'),
        },
        {
          role: 'user',
          content:
            "Newton's first law is about inertia — objects stay still or keep moving unless a force acts on them. The second law is F=ma.",
          timestamp: new Date('2026-03-18T14:01:00Z'),
        },
        {
          role: 'assistant',
          content: 'Good! What about the third law?',
          timestamp: new Date('2026-03-18T14:01:45Z'),
        },
        {
          role: 'user',
          content:
            'The third law says every action has an equal and opposite reaction, like a rocket pushing gas downward and being pushed upward.',
          timestamp: new Date('2026-03-18T14:02:30Z'),
        },
      ],
      summary:
        "Bob covered all three of Newton's laws with a solid grasp of the first and third. Could improve depth on the mathematical implications of F=ma.",
    },
    {
      _id: TEACHING_SESSION_IDS.carolML,
      userId: USER_IDS.carol,
      title: 'ML Fundamentals Review',
      topic: 'Introduction to Machine Learning',
      sources: [
        {
          title: 'ML Course Notes - Week 1',
          content:
            'Supervised learning uses labeled training data. Unsupervised learning finds patterns without labels. Common algorithms include linear regression, decision trees, k-means clustering, and neural networks.',
          type: 'document',
        },
      ],
      chatHistory: [
        {
          role: 'assistant',
          content: 'Please teach me about Introduction to Machine Learning.',
          timestamp: new Date('2026-03-20T10:00:00Z'),
        },
        {
          role: 'user',
          content:
            'Machine learning is a field of AI where models learn patterns from data. Supervised learning trains on labeled data for tasks like classification and regression. Unsupervised learning finds hidden structure in unlabeled data.',
          timestamp: new Date('2026-03-20T10:01:00Z'),
        },
        {
          role: 'assistant',
          content: 'Wonderful! Can you explain what overfitting is and how to prevent it?',
          timestamp: new Date('2026-03-20T10:02:00Z'),
        },
        {
          role: 'user',
          content:
            'Overfitting is when a model memorizes training data too closely and fails to generalize. Prevention techniques include regularization (L1/L2), dropout in neural networks, cross-validation, and early stopping.',
          timestamp: new Date('2026-03-20T10:03:00Z'),
        },
      ],
      summary:
        'Carol showed comprehensive understanding of ML fundamentals, correctly explaining learning paradigms and overfitting prevention with specific regularization techniques.',
    },
  ];

  await teachingSessionModel.deleteMany({});
  await teachingSessionModel.insertMany(sessions);
  console.log(`Seeded ${sessions.length} teaching sessions`);
}
