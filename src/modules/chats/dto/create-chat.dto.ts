import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsMongoId()
  @IsNotEmpty()
  topicId: string;

  @IsMongoId()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsOptional()
  topicTitle?: string;
}
