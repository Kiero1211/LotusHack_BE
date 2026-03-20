import { Model, Types } from 'mongoose';
import { Topic, DifficultyLevel } from 'src/modules/topics/schemas/topic.schema';

export const TOPIC_IDS = {
  photosynthesis: new Types.ObjectId('64b1c2d3e4f5a6b7c8d9e001'),
  machineLearnig: new Types.ObjectId('64b1c2d3e4f5a6b7c8d9e002'),
  newtonLaws: new Types.ObjectId('64b1c2d3e4f5a6b7c8d9e003'),
  frenchRevolution: new Types.ObjectId('64b1c2d3e4f5a6b7c8d9e004'),
  linearAlgebra: new Types.ObjectId('64b1c2d3e4f5a6b7c8d9e005'),
};

export async function seedTopics(topicModel: Model<Topic>): Promise<void> {
  const topics = [
    {
      _id: TOPIC_IDS.photosynthesis,
      title: 'Photosynthesis',
      description:
        'The biological process by which green plants convert sunlight, water, and carbon dioxide into glucose and oxygen.',
      difficulty: DifficultyLevel.EASY,
    },
    {
      _id: TOPIC_IDS.machineLearnig,
      title: 'Introduction to Machine Learning',
      description:
        'Core concepts of machine learning including supervised learning, unsupervised learning, and model evaluation.',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      _id: TOPIC_IDS.newtonLaws,
      title: "Newton's Laws of Motion",
      description:
        'The three fundamental laws describing the relationship between a body and the forces acting upon it.',
      difficulty: DifficultyLevel.EASY,
    },
    {
      _id: TOPIC_IDS.frenchRevolution,
      title: 'The French Revolution',
      description:
        'A period of radical political and societal change in France from 1789 to 1799, leading to the abolition of the monarchy.',
      difficulty: DifficultyLevel.MEDIUM,
    },
    {
      _id: TOPIC_IDS.linearAlgebra,
      title: 'Linear Algebra',
      description:
        'The branch of mathematics dealing with vector spaces, linear transformations, eigenvalues, and matrix decomposition.',
      difficulty: DifficultyLevel.HARD,
    },
  ];

  await topicModel.deleteMany({});
  await topicModel.insertMany(topics);
  console.log(`Seeded ${topics.length} topics`);
}
