import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum ChatRoleDto {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class SourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}

export class ChatMessageDto {
  @IsEnum(ChatRoleDto)
  role: ChatRoleDto;

  @IsString()
  @IsNotEmpty()
  content: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  timestamp?: Date;
}

export class PatchTeachingSessionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @ValidateNested()
  @Type(() => SourceDto)
  @IsOptional()
  source?: SourceDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  @IsOptional()
  chatHistory?: ChatMessageDto[];
}
