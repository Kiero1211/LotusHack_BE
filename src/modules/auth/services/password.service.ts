import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  constructor(private readonly configService: ConfigService) {}

  async hash(password: string): Promise<string> {
    const saltRounds = this.configService.getOrThrow<number>('auth.saltRounds');

    return bcrypt.hash(password, saltRounds);
  }

  async compare(password: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(password, hashed);
  }
}
