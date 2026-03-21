import { IsNotEmpty, IsString } from 'class-validator';

export class UploadDocumentsDto {
  @IsString()
  @IsNotEmpty()
  teachingSessionId: string;
}
