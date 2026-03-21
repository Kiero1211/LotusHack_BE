import { IsMongoId, IsOptional } from 'class-validator';

export class ListChatsQueryDto {
  @IsMongoId()
  @IsOptional()
  topicId?: string;
}
