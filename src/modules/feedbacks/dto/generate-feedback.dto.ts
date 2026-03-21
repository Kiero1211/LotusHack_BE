import { IsMongoId } from 'class-validator';

export class GenerateFeedbackDto {
  @IsMongoId()
  chatId: string;
}
