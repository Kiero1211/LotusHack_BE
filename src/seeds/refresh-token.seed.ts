import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from 'src/modules/auth/schemas/refresh-token.schema';
import { USER_IDS } from './user.seed';

export async function seedRefreshTokens(refreshTokenModel: Model<RefreshToken>): Promise<void> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const hashedToken1 = await bcrypt.hash('sample-refresh-token-alice', 10);
  const hashedToken2 = await bcrypt.hash('sample-refresh-token-bob', 10);

  const tokens = [
    {
      userId: USER_IDS.alice,
      hashedToken: hashedToken1,
      expiresAt: thirtyDaysFromNow,
    },
    {
      userId: USER_IDS.bob,
      hashedToken: hashedToken2,
      expiresAt: thirtyDaysFromNow,
    },
  ];

  await refreshTokenModel.deleteMany({});
  await refreshTokenModel.insertMany(tokens);
  console.log(`Seeded ${tokens.length} refresh tokens`);
}
