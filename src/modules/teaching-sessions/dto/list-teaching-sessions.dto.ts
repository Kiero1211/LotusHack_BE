import { IsMongoId, IsOptional } from 'class-validator';

export class ListTeachingSessionsDto {
  @IsMongoId()
  @IsOptional()
  user_id?: string;
}
