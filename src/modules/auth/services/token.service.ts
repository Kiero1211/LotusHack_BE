import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import ms, { StringValue } from 'ms';
import { ITokenType } from 'src/common/constants/auth';
import { AuthTokens, JwtPayload } from '../interfaces/auth.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { PasswordService } from './password.service';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private passwordService: PasswordService,
    private refreshTokenRepository: RefreshTokenRepository,
  ) {}

  private async signToken(payload: JwtPayload, type: ITokenType): Promise<string> {
    const secret = this.configService.getOrThrow<string>(`auth.tokens.${type}Secret`);
    const expiresIn = this.configService.getOrThrow<StringValue>(`auth.tokens.${type}Expiration`);

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken({ sub: userId, email }, 'access'),
      this.signToken({ sub: userId, email }, 'refresh'),
    ]);

    return { accessToken, refreshToken };
  }

  async storeRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await this.passwordService.hash(refreshToken);
    // Remove old refresh tokens
    await this.refreshTokenRepository.deleteByUserId(userId);
    const expiresIn = this.configService.getOrThrow<StringValue>('auth.tokens.refreshExpiration');
    const expiresAt = new Date(Date.now() + ms(expiresIn));
    await this.refreshTokenRepository.create({
      userId: new Types.ObjectId(userId),
      hashedToken,
      expiresAt,
    });
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const storedTokens = await this.refreshTokenRepository.findByUserId(userId);

    if (!storedTokens || storedTokens.length === 0) {
      return false;
    }

    for (const stored of storedTokens) {
      const isMatch = await this.passwordService.compare(refreshToken, stored.hashedToken);
      if (isMatch) {
        return true;
      }
    }
    await this.refreshTokenRepository.deleteByUserId(userId);
    return false;
  }

  async revokeAllTokens(userId: string) {
    await this.refreshTokenRepository.deleteByUserId(userId);
  }
}
