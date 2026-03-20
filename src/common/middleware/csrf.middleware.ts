import { ConfigService } from '@nestjs/config';
import { doubleCsrf, DoubleCsrfUtilities } from 'csrf-csrf';
import { NextFunction, Request, Response } from 'express';
import { CSRF_EXCLUDED_ROUTES, REFRESH_TOKEN_COOKIE } from '../constants/auth';

export const getCsrfOptions = (configService: ConfigService): DoubleCsrfUtilities => {
  const secret = configService.get<string>('auth.csrfSecret') || 'default-csrf-secret';

  return doubleCsrf({
    getSecret: () => secret,
    getSessionIdentifier: (req: Request) => (req.cookies?.[REFRESH_TOKEN_COOKIE] as string) || '',
    cookieName: 'x-xsrf-token',
    cookieOptions: {
      httpOnly: false,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (req: Request) => req.headers['x-xsrf-token'] as string,
  });
};

export const csrfProtection = (configService: ConfigService) => {
  const { doubleCsrfProtection } = getCsrfOptions(configService);
  return (req: Request, res: Response, next: NextFunction) => {
    if (CSRF_EXCLUDED_ROUTES.includes(req.path)) {
      return next();
    }
    return doubleCsrfProtection(req, res, next);
  };
};
