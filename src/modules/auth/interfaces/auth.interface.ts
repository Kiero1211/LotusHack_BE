import { User } from '../../users/schema/user.schema';

export interface JwtPayload {
  email: string;
  sub: string;
}

export interface OAuthProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar_url?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: Omit<User, 'password'>;
}
