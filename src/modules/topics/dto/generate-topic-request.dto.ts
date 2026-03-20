import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class GenerateTopicRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  documentIds: string[];
}
