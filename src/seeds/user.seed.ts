import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from 'src/modules/users/schema/user.schema';
import { AuthProvider } from 'src/common/constants/auth';

export const USER_IDS = {
  alice: new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d001'),
  bob: new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d002'),
  carol: new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d003'),
};

export async function seedUsers(userModel: Model<User>): Promise<void> {
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const users = [
    {
      _id: USER_IDS.alice,
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Nguyen',
      password: hashedPassword,
      providers: [{ provider: AuthProvider.EMAIL, providerId: 'alice@example.com' }],
      role: 'user',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      currentStreak: 7,
      totalPoints: 1250,
      topicsMastered: 3,
    },
    {
      _id: USER_IDS.bob,
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Smith',
      password: hashedPassword,
      providers: [{ provider: AuthProvider.GOOGLE, providerId: 'google-oauth2|bob123' }],
      role: 'user',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      currentStreak: 2,
      totalPoints: 430,
      topicsMastered: 1,
    },
    {
      _id: USER_IDS.carol,
      email: 'carol@example.com',
      firstName: 'Carol',
      lastName: 'Johnson',
      password: hashedPassword,
      providers: [{ provider: AuthProvider.EMAIL, providerId: 'carol@example.com' }],
      role: 'admin',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
      currentStreak: 14,
      totalPoints: 3800,
      topicsMastered: 8,
    },
  ];

  await userModel.deleteMany({});
  await userModel.insertMany(users);
  console.log(`Seeded ${users.length} users`);
}
