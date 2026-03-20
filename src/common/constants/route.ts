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
  BY_CHAT: ':chatId',
  NEWEST: ':chatId/newest',
} as const;

export const DOCUMENT_ROUTES = {
  BASE: 'documents',
  UPLOAD: 'upload',
  STATUS_BY_BATCH: 'status/:batchId',
} as const;

export const GENERATE_TOPIC_ROUTES = {
  BASE: 'generate-topic',
  BY_TEACHING_SESSION: ':teachingSessionId',
} as const;
