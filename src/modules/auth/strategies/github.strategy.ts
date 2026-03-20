import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('auth.github.clientId'),
      clientSecret: configService.getOrThrow<string>('auth.github.clientSecret'),
      callbackURL: configService.getOrThrow<string>('auth.github.callbackURL'),
      scope: ['user:email'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const { id, username, emails, photos } = profile;

    const email = emails?.[0]?.value ?? '';
    const avatar = photos?.[0]?.value ?? '';

    return {
      id,
      email,
      firstName: username ?? '',
      lastName: '',
      avatar_url: avatar,
    };
  }
}
