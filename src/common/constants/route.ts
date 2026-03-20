export const AUTH_ROUTES = {
  BASE: 'auth',
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout',
  REFRESH: 'refresh',
  GOOGLE: 'google',
  GOOGLE_CALLBACK: 'google/callback',
  GITHUB: 'github',
  GITHUB_CALLBACK: 'github/callback',
  PROFILE: 'profile',
} as const;

export const FEEDBACK_ROUTES = {
  BASE: 'feedbacks',
  BY_TOPIC: ':topicId',
  NEWEST: ':topicId/newest',
} as const;
