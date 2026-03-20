import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from 'src/common/constants/auth';
import { AUTH_ROUTES } from 'src/common/constants/route';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';

import { UserResponseDto } from '../../users/dto/user-response';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { GithubOAuthGuard } from '../guards/github-oauth.guard';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from '../guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { OAuthProfile } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

interface OAuthRequest extends ExpressRequest {
  user: OAuthProfile;
}

interface RefreshRequest extends ExpressRequest {
  user: { sub: string; email: string; refreshToken: string };
}

@Controller(AUTH_ROUTES.BASE)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private setAuthCookies(res: ExpressResponse, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...ACCESS_TOKEN_COOKIE_OPTIONS,
      maxAge: this.configService.get('auth.cookies.accessTokenMaxAge'),
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...REFRESH_TOKEN_COOKIE_OPTIONS,
      maxAge: this.configService.get('auth.cookies.refreshTokenMaxAge'),
    });
  }

  private clearAllAuthCookies(res: ExpressResponse) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.clearCookie(REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE_OPTIONS);
  }

  @Post(AUTH_ROUTES.REGISTER)
  @Serialize(UserResponseDto)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post(AUTH_ROUTES.LOGIN)
  @HttpCode(HttpStatus.OK)
  @Serialize(UserResponseDto)
  async login(@Body() loginDto: LoginDto, @Response({ passthrough: true }) res: ExpressResponse) {
    const { refreshToken, accessToken, user } = await this.authService.login(loginDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return user;
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post(AUTH_ROUTES.REFRESH)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req: RefreshRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const { sub: userId, refreshToken: currentRefreshToken } = req.user;
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      userId,
      currentRefreshToken,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { message: 'Tokens refreshed successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(AUTH_ROUTES.LOGOUT)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: AuthenticatedRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    await this.authService.logout(req.user.userId);
    this.clearAllAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(GoogleOAuthGuard)
  @Get(AUTH_ROUTES.GOOGLE)
  async googleAuth() {
    // Guard redirects
  }

  @UseGuards(GoogleOAuthGuard)
  @Get(AUTH_ROUTES.GOOGLE_CALLBACK)
  async googleAuthRedirect(@Request() req: OAuthRequest, @Response() res: ExpressResponse) {
    const { refreshToken, accessToken } = await this.authService.validateOAuthLogin(
      req.user,
      'google',
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/auth/callback`);
  }

  @UseGuards(GithubOAuthGuard)
  @Get(AUTH_ROUTES.GITHUB)
  async githubAuth() {
    // Guard redirects
  }

  @UseGuards(GithubOAuthGuard)
  @Get(AUTH_ROUTES.GITHUB_CALLBACK)
  async githubAuthRedirect(@Request() req: OAuthRequest, @Response() res: ExpressResponse) {
    const { refreshToken, accessToken } = await this.authService.validateOAuthLogin(
      req.user,
      'github',
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/auth/callback`);
  }

  @UseGuards(JwtAuthGuard)
  @Get(AUTH_ROUTES.PROFILE)
  @Serialize(UserResponseDto)
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }
}
