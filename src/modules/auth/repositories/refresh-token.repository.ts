import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh-token.schema';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async create(data: Partial<RefreshToken>) {
    return this.refreshTokenModel.create(data);
  }

  async findByUserId(userId: string) {
    return this.refreshTokenModel.find({ userId });
  }

  async deleteByUserId(userId: string) {
    return this.refreshTokenModel.deleteMany({ userId });
  }

  async deleteExpired() {
    return this.refreshTokenModel.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}
