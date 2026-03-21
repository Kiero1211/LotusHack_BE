import { IsMongoId, IsOptional } from 'class-validator';

export class GetFeedbackQueryDto {
  @IsMongoId()
  @IsOptional()
  chatId?: string;
}
