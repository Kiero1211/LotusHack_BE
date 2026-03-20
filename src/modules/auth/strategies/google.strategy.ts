import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile } from 'passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('auth.google.clientId'),
      clientSecret: configService.getOrThrow<string>('auth.google.clientSecret'),
      callbackURL: configService.getOrThrow<string>('auth.google.callbackURL'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos, id } = profile;
    const user = {
      id: id,
      email: emails && emails[0] ? emails[0].value : undefined,
      firstName: name?.givenName,
      lastName: name?.familyName,
      avatar_url: photos && photos[0] ? photos[0].value : undefined,
    };
    done(null, user);
  }
}
