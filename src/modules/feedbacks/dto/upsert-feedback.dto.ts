import { IsArray, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertFeedbackDto {
  @IsMongoId()
  chatId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  masteryScore: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  missedConcepts?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  strengthsHighlighted?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  gentleSuggestions?: string[];
}
