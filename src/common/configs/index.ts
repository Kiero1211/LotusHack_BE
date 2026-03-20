export const databaseConfig = () => ({
  database: {
    uri: process.env.DB_URI || 'mongodb://localhost:27017/hkt-db',
  },
});

export const authConfig = () => ({
  auth: {
    tokens: {
      accessSecret: process.env.JWT_ACCESS_SECRET || 'default-secret',
      accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    },
    saltRounds: Number(process.env.SALT_ROUNDS) || 12,
    cookies: {
      accessTokenMaxAge: Number(process.env.ACCESS_TOKEN_MAX_AGE) || 15 * 60 * 1000,
      refreshTokenMaxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
    },
  },
});

export const openaiConfig = () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
});
