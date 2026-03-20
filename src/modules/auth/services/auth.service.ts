import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, IAuthProvider } from '../../../common/constants/auth';
import { User, UserDocument } from '../../users/schema/user.schema';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponse, AuthTokens, OAuthProfile } from '../interfaces/auth.interface';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private passwordService: PasswordService,
    private tokenService: TokenService,
  ) {}

  private async createSession(userId: string, email: string): Promise<AuthTokens> {
    const tokens = await this.tokenService.generateTokens(userId, email);
    await this.tokenService.storeRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  async register(registrationData: RegisterDto): Promise<Partial<User>> {
    const existingUser = await this.usersService.findByEmail(registrationData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.passwordService.hash(registrationData.password);
    const user = await this.usersService.create({
      ...registrationData,
      password: hashedPassword,
      providers: [{ provider: AuthProvider.EMAIL, providerId: registrationData.email }],
    });

    const { password: _password, ...result } = user.toObject();
    return result;
  }

  async validateUser(email: string, pass: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password) {
      const isMatch = await this.passwordService.compare(pass, user.password);
      if (isMatch) return user;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.createSession(user._id.toString(), user.email);
    const { password: _pwd, ...userResult } = user.toObject();
    return { user: userResult, ...tokens };
  }

  async refreshTokens(userId: string, currentRefreshToken: string): Promise<AuthTokens> {
    const isValid = await this.tokenService.validateRefreshToken(userId, currentRefreshToken);
    if (!isValid) {
      throw new ForbiddenException('Access denied');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    return this.createSession(userId, user.email);
  }

  async logout(userId: string): Promise<void> {
    await this.tokenService.revokeAllTokens(userId);
  }

  async validateOAuthLogin(profile: OAuthProfile, provider: IAuthProvider): Promise<AuthResponse> {
    const { email, firstName, lastName, avatar_url, id } = profile;

    if (!email) {
      throw new ConflictException(`OAuth profile from ${provider} did not provide an email.`);
    }

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.create({
        email,
        firstName,
        lastName,
        avatar_url,
        providers: [{ provider, providerId: id }],
      });
    } else {
      const hasProvider = user.providers.some(p => p.provider === provider);
      if (!hasProvider) {
        user.providers.push({ provider, providerId: id });
        await user.save();
      }
    }

    if (!user) {
      throw new Error('User creation failed or user not found');
    }

    const tokens = await this.createSession(user._id.toString(), user.email);
    const { password: _pw, ...userResult } = user.toObject();
    return { user: userResult, ...tokens };
  }
}
