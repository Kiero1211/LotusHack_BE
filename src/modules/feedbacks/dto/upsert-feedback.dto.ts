import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertFeedbackDto {
  @IsMongoId()
  topicId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  masteryScore: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  missedConcepts?: string[];

  @IsString()
  @IsNotEmpty()
  strengthsHighlighted: string;

  @IsString()
  @IsNotEmpty()
  gentleSuggestions: string;
}
