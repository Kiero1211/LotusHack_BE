export const AUTH_ROUTES = {
  BASE: '/api/auth',
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout',
  REFRESH: 'refresh',
  GOOGLE: 'google',
  GOOGLE_CALLBACK: 'google/callback',
  GITHUB: 'github',
  GITHUB_CALLBACK: 'github/callback',
  CSRF_TOKEN: 'csrf-token',
  PROFILE: 'profile',
} as const;
