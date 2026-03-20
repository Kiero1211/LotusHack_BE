import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  AuthProvider,
  UserRole,
  type IAuthProvider,
  type IUserRole,
} from 'src/common/constants/auth';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class Provider {
  @Prop({ type: String, required: true, enum: Object.values(AuthProvider) })
  provider: IAuthProvider;

  @Prop({ required: true })
  providerId: string;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String })
  password?: string;

  @Prop({ type: [Provider], default: [] })
  providers: Provider[];

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: IUserRole;

  @Prop({ type: String })
  avatar_url: string;

  @Prop({ type: Number, default: 0 })
  currentStreak: number;

  @Prop({ type: Number, default: 0 })
  totalPoints: number;

  @Prop({ type: Number, default: 0 })
  topicsMastered: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
