import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTeachingSessionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  topic?: string;
}
