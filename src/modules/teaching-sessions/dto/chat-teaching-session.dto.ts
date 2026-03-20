import { IsNotEmpty, IsString } from 'class-validator';

export class ChatTeachingSessionDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
