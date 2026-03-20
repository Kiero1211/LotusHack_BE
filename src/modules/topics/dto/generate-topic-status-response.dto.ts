import { TopicGenerationStatus } from '../schemas/topic-generation.schema';

export class GenerateTopicStatusItemDto {
  topicId: string;
  title: string;
  difficulty: string;
  description: string;
}

export class ProcessingDocumentDto {
  documentId: string;
  title: string;
}

export class GenerateTopicStatusResponseDto {
  status: TopicGenerationStatus;
  processingDocument: ProcessingDocumentDto | null;
  topics: GenerateTopicStatusItemDto[];
}
