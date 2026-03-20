import { TopicGenerationStatus } from '../schemas/topic-generation.schema';

export class GenerateTopicResponseDto {
  requestId: string;
  status: TopicGenerationStatus;
}
