import { API_PREFIX } from '.';
import { AUTH_ROUTES } from './route';

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

export const CSRF_EXCLUDED_ROUTES: string[] = [
  `/${API_PREFIX}/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.LOGIN}`,
  `/${API_PREFIX}/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.REGISTER}`,
  `/${API_PREFIX}/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.GOOGLE}`,
  `/${API_PREFIX}/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.GOOGLE_CALLBACK}`,
  `/${API_PREFIX}/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.GITHUB}`,
  `/${API_PREFIX}/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.GITHUB_CALLBACK}`,
  `/${API_PREFIX}/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.CSRF_TOKEN}`,
];
