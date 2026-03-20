import { Model } from 'mongoose';
import { TopicMastery, MasteryLevel } from 'src/modules/topics/schemas/topic-mastery.schema';
import { USER_IDS } from './user.seed';
import { TOPIC_IDS } from './topic.seed';

export async function seedTopicMasteries(
  topicMasteryModel: Model<TopicMastery>,
): Promise<void> {
  const masteries = [
    {
      userId: USER_IDS.alice,
      topicId: TOPIC_IDS.photosynthesis,
      masteryLevel: MasteryLevel.EXPERT,
      bestScore: 92,
    },
    {
      userId: USER_IDS.alice,
      topicId: TOPIC_IDS.newtonLaws,
      masteryLevel: MasteryLevel.ADVANCED,
      bestScore: 81,
    },
    {
      userId: USER_IDS.alice,
      topicId: TOPIC_IDS.frenchRevolution,
      masteryLevel: MasteryLevel.INTERMEDIATE,
      bestScore: 65,
    },
    {
      userId: USER_IDS.bob,
      topicId: TOPIC_IDS.newtonLaws,
      masteryLevel: MasteryLevel.BEGINNER,
      bestScore: 45,
    },
    {
      userId: USER_IDS.carol,
      topicId: TOPIC_IDS.machineLearnig,
      masteryLevel: MasteryLevel.EXPERT,
      bestScore: 88,
    },
    {
      userId: USER_IDS.carol,
      topicId: TOPIC_IDS.linearAlgebra,
      masteryLevel: MasteryLevel.ADVANCED,
      bestScore: 79,
    },
    {
      userId: USER_IDS.carol,
      topicId: TOPIC_IDS.photosynthesis,
      masteryLevel: MasteryLevel.EXPERT,
      bestScore: 95,
    },
  ];

  await topicMasteryModel.deleteMany({});
  await topicMasteryModel.insertMany(masteries);
  console.log(`Seeded ${masteries.length} topic masteries`);
}
