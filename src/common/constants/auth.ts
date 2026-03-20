
export const AuthProvider = {
  GOOGLE: 'google',
  GITHUB: 'github',
  EMAIL: 'email',
} as const;

export type IAuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const TokenType = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  VERIFY_EMAIL: 'verifyEmail',
  RESET_PASSWORD: 'resetPassword',
} as const;

export type ITokenType = (typeof TokenType)[keyof typeof TokenType];

export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type IUserRole = (typeof UserRole)[keyof typeof UserRole];

export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

