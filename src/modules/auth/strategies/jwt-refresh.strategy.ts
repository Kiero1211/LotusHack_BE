import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return (req?.cookies?.['refresh_token'] as string) ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('auth.tokens.refreshSecret'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  validate(req: Request, payload: JwtPayload) {
    const refreshToken = req?.cookies?.['refresh_token'] as string;
    if (!refreshToken) {
      throw new ForbiddenException('Refresh token not found');
    }
    return { ...payload, refreshToken };
  }
}
