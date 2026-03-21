import { Model, Types } from 'mongoose';
import { Chat } from 'src/modules/chats/schemas/chat.schema';
import { TOPIC_IDS } from './topic.seed';
import { USER_IDS } from './user.seed';
import { TEACHING_SESSION_IDS } from './teaching-session.seed';

export const CHAT_IDS = {
  alicePhotosynthesisChat1: new Types.ObjectId('64d1e2f3a4b5c6d7e8f9a001'),
  alicePhotosynthesisChat2: new Types.ObjectId('64d1e2f3a4b5c6d7e8f9a004'),
  bobNewtonChat: new Types.ObjectId('64d1e2f3a4b5c6d7e8f9a002'),
  carolMLChat: new Types.ObjectId('64d1e2f3a4b5c6d7e8f9a003'),
};

export async function seedChats(chatModel: Model<Chat>): Promise<void> {
  const now = new Date();

  const chats = [
    {
      _id: CHAT_IDS.alicePhotosynthesisChat1,
      userId: USER_IDS.alice,
      sessionId: TEACHING_SESSION_IDS.alicePhotosynthesis,
      topicId: TOPIC_IDS.photosynthesis,
      topicTitle: 'Photosynthesis',
      chatItems: [
        {
          role: 'assistant',
          content: "Hi! I'm so excited to learn about 'Photosynthesis'! Can you explain this concept to me?",
          timestamp: new Date(now.getTime() - 10 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            'Photosynthesis is the process plants use to convert light energy from the sun into chemical energy stored as glucose. It happens in the chloroplasts, specifically using chlorophyll.',
          timestamp: new Date(now.getTime() - 9 * 60 * 1000),
        },
        {
          role: 'assistant',
          content:
            'That is a great start! Can you tell me more about the two main stages of photosynthesis?',
          timestamp: new Date(now.getTime() - 8 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            'Sure! The first stage is the light-dependent reactions which happen in the thylakoid membrane, where water is split and ATP and NADPH are produced. The second stage is the Calvin cycle in the stroma, which uses that energy to fix CO2 into glucose.',
          timestamp: new Date(now.getTime() - 7 * 60 * 1000),
        },
        {
          role: 'assistant',
          content:
            'Excellent explanation! What is the overall chemical equation for photosynthesis?',
          timestamp: new Date(now.getTime() - 6 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            '6CO2 + 6H2O + light energy → C6H12O6 + 6O2. So six carbon dioxide molecules and six water molecules produce one glucose molecule and six oxygen molecules.',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000),
        },
      ],
    },
    {
      _id: CHAT_IDS.alicePhotosynthesisChat2,
      userId: USER_IDS.alice,
      sessionId: TEACHING_SESSION_IDS.alicePhotosynthesis,
      topicId: TOPIC_IDS.photosynthesis,
      topicTitle: 'Photosynthesis',
      chatItems: [
        {
          role: 'assistant',
          content: "Hi! I'm so excited to learn about 'Photosynthesis'! Can you explain this concept to me?",
          timestamp: new Date(now.getTime() - 2 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            'Let me review — photosynthesis converts light, water, and CO2 into glucose and oxygen inside chloroplasts. The light reactions split water and create ATP; the Calvin cycle uses that ATP to fix carbon.',
          timestamp: new Date(now.getTime() - 1 * 60 * 1000),
        },
        {
          role: 'assistant',
          content:
            'Great recall! Can you go deeper — what specific molecules does the electron transport chain produce during the light reactions?',
          timestamp: new Date(now.getTime() - 30 * 1000),
        },
      ],
    },
    {
      _id: CHAT_IDS.bobNewtonChat,
      userId: USER_IDS.bob,
      sessionId: TEACHING_SESSION_IDS.bobNewton,
      topicId: TOPIC_IDS.newtonLaws,
      topicTitle: "Newton's Laws of Motion",
      chatItems: [
        {
          role: 'assistant',
          content: "Hi! I'm so excited to learn about 'Newton's Laws of Motion'! Can you explain this concept to me?",
          timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            "Newton's first law says an object stays at rest or in motion unless acted upon by a force. It's also called the law of inertia.",
          timestamp: new Date(now.getTime() - 29 * 60 * 1000),
        },
        {
          role: 'assistant',
          content:
            "Good! And what about the second and third laws? Can you explain Newton's second law with its equation?",
          timestamp: new Date(now.getTime() - 28 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            "The second law is F=ma, force equals mass times acceleration. The third law... I think it's something about every action having an equal reaction?",
          timestamp: new Date(now.getTime() - 27 * 60 * 1000),
        },
      ],
    },
    {
      _id: CHAT_IDS.carolMLChat,
      userId: USER_IDS.carol,
      sessionId: TEACHING_SESSION_IDS.carolML,
      topicId: TOPIC_IDS.machineLearnig,
      topicTitle: 'Introduction to Machine Learning',
      chatItems: [
        {
          role: 'assistant',
          content: "Hi! I'm so excited to learn about 'Introduction to Machine Learning'! Can you explain this concept to me?",
          timestamp: new Date(now.getTime() - 60 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            'Machine learning is a subset of AI where systems learn from data to make predictions or decisions without being explicitly programmed. There are three main types: supervised, unsupervised, and reinforcement learning.',
          timestamp: new Date(now.getTime() - 59 * 60 * 1000),
        },
        {
          role: 'assistant',
          content:
            'Great overview! Can you explain the difference between supervised and unsupervised learning with examples?',
          timestamp: new Date(now.getTime() - 58 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            'In supervised learning, the model is trained on labeled data. For example, classifying emails as spam or not spam. In unsupervised learning, there are no labels — the model finds hidden patterns, like clustering customers by purchasing behavior.',
          timestamp: new Date(now.getTime() - 57 * 60 * 1000),
        },
        {
          role: 'assistant',
          content: 'Perfect! Can you explain overfitting and how to prevent it?',
          timestamp: new Date(now.getTime() - 56 * 60 * 1000),
        },
        {
          role: 'user',
          content:
            'Overfitting is when a model learns the training data too well, including noise, and performs poorly on new data. You can prevent it using techniques like regularization, dropout, cross-validation, or getting more training data.',
          timestamp: new Date(now.getTime() - 55 * 60 * 1000),
        },
      ],
    },
  ];

  await chatModel.deleteMany({});
  await chatModel.insertMany(chats);
  console.log(`Seeded ${chats.length} chats`);
}
