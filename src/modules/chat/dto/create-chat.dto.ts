import { IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  topic_id: string;
}
