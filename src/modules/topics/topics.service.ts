import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentsService } from '../documents/documents.service';
import { TeachingSessionsService } from '../teaching-sessions/teaching-sessions.service';
import { GenerateTopicResponseDto } from './dto/generate-topic-response.dto';
import { GenerateTopicStatusResponseDto } from './dto/generate-topic-status-response.dto';
import { TopicMasteryItemDto } from './dto/topic-mastery-response.dto';
import { TopicGeneration, TopicGenerationStatus } from './schemas/topic-generation.schema';
import { TopicMastery } from './schemas/topic-mastery.schema';
import { DifficultyLevel, Topic } from './schemas/topic.schema';
import { TopicAiService } from './services/topic-ai.service';

type StartGenerationInput = {
  userId: string;
  teachingSessionId: string;
  documentIds: string[];
};

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectModel(TopicGeneration.name)
    private readonly topicGenerationModel: Model<TopicGeneration>,
    @InjectModel(Topic.name)
    private readonly topicModel: Model<Topic>,
    @InjectModel(TopicMastery.name)
    private readonly topicMasteryModel: Model<TopicMastery>,
    private readonly teachingSessionsService: TeachingSessionsService,
    private readonly documentsService: DocumentsService,
    private readonly topicAiService: TopicAiService,
  ) {}

  async startGeneration(input: StartGenerationInput): Promise<GenerateTopicResponseDto> {
    
    await this.teachingSessionsService.getSessionById(input.userId, input.teachingSessionId);

    if (!input.documentIds.length) {
      throw new BadRequestException('documentIds must not be empty');
    }

    const queuedDocuments = await this.resolveQueuedDocuments(
      input.teachingSessionId,
      input.documentIds,
    );

    let generation = await this.topicGenerationModel
      .findOne({ teachingSessionId: input.teachingSessionId })
      .exec();

    if (!generation) {
      generation = await this.topicGenerationModel.create({
        teachingSessionId: input.teachingSessionId,
        status: TopicGenerationStatus.PENDING,
        sourceDocumentId: null,
        queuedDocuments,
        topics: [],
        errorMessage: null,
      });
    } else {
      generation.status = TopicGenerationStatus.PENDING;
      generation.sourceDocumentId = null;
      generation.queuedDocuments = queuedDocuments;
      generation.topics = [];
      generation.errorMessage = null;
      await generation.save();
    }

    void this.processGeneration(generation.id).catch(error => {
      this.logger.error(
        `Failed to process topic generation ${generation.id}: ${(error as Error).message}`,
      );
    });

    return {
      requestId: generation.id,
      status: generation.status,
    };
  }

  async getGenerationStatus(
    userId: string,
    teachingSessionId: string,
  ): Promise<GenerateTopicStatusResponseDto> {
    
    await this.teachingSessionsService.getSessionById(userId, teachingSessionId);

    const generation = await this.topicGenerationModel.findOne({ teachingSessionId }).exec();

    if (!generation) {
      return {
        status: TopicGenerationStatus.PENDING,
        processingDocument: null,
        topics: [],
      };
    }

    const processingDocument = this.getProcessingDocument(generation);

    return {
      status: generation.status,
      processingDocument,
      topics: generation.topics.map(topic => ({
        topicId: topic.topicId,
        title: topic.title,
        difficulty: topic.difficulty,
        description: topic.description,
      })),
    };
  }

  async getMasteryBySession(
    userId: string,
    teachingSessionId: string,
  ): Promise<TopicMasteryItemDto[]> {
    const generation = await this.topicGenerationModel
      .findOne({ teachingSessionId })
      .exec();

    if (!generation || !generation.topics.length) {
      return [];
    }

    const topicObjectIds = generation.topics.map(
      (t) => new Types.ObjectId(t.topicId),
    );

    const masteries = await this.topicMasteryModel
      .find({
        userId: new Types.ObjectId(userId),
        topicId: { $in: topicObjectIds },
      })
      .exec();

    return masteries.map((m) => ({
      topicId: m.topicId.toString(),
      bestScore: m.bestScore,
      taughtCount: m.taughtCount,
      masteryLevel: m.masteryLevel,
    }));
  }

  private async processGeneration(generationId: string): Promise<void> {
    try {
      let generation = await this.topicGenerationModel.findById(generationId).exec();
      if (!generation) {
        throw new InternalServerErrorException('Topic generation request not found');
      }

      const aggregatedTopics: {
        topicId: string;
        title: string;
        difficulty: DifficultyLevel;
        description: string;
      }[] = [];

      const queuedDocuments = generation.queuedDocuments || [];

      for (const queuedDocument of queuedDocuments) {
        await this.topicGenerationModel
          .findByIdAndUpdate(generationId, {
            status: TopicGenerationStatus.PROCESSING,
            sourceDocumentId: queuedDocument.documentId,
            errorMessage: null,
          })
          .exec();

        const sourceDocument = await this.documentsService.getDocumentById(
          queuedDocument.documentId,
        );
        if (!sourceDocument) {
          throw new BadRequestException(`Document not found: ${queuedDocument.documentId}`);
        }

        const sourceText = (sourceDocument.processedText || '').trim();
        if (!sourceText) {
          throw new BadRequestException(
            `Document has no processed text: ${queuedDocument.documentId}`,
          );
        }

        const aiTopics = await this.topicAiService.generateTopicsFromDocument(sourceText);
        const topicsPayload = aiTopics.map(topic => ({
          title: topic.title,
          difficulty: this.toDifficultyEnum(topic.difficulty),
          description: topic.description,
        }));

        const createdTopics = await this.topicModel.insertMany(topicsPayload);
        for (const topic of createdTopics) {
          aggregatedTopics.push({
            topicId: topic._id.toString(),
            title: topic.title,
            difficulty: topic.difficulty,
            description: topic.description,
          });
        }
      }

      await this.topicGenerationModel
        .findByIdAndUpdate(generationId, {
          status: TopicGenerationStatus.COMPLETED,
          topics: aggregatedTopics,
          sourceDocumentId: null,
          errorMessage: null,
        })
        .exec();
    } catch (error) {
      await this.topicGenerationModel
        .findByIdAndUpdate(generationId, {
          status: TopicGenerationStatus.FAILED,
          sourceDocumentId: null,
          errorMessage: (error as Error).message,
        })
        .exec();

      throw new InternalServerErrorException('Topic generation failed');
    }
  }

  private toDifficultyEnum(value: string): DifficultyLevel {
    if (value === DifficultyLevel.EASY) {
      return DifficultyLevel.EASY;
    }
    if (value === DifficultyLevel.HARD) {
      return DifficultyLevel.HARD;
    }
    return DifficultyLevel.MEDIUM;
  }

  private async resolveQueuedDocuments(teachingSessionId: string, documentIds: string[]) {
    const dedupedIds = [...new Set(documentIds)];
    const queuedDocuments: { documentId: string; title: string }[] = [];

    for (const documentId of dedupedIds) {
      const document = await this.documentsService.getDocumentById(documentId);

      if (!document) {
        throw new BadRequestException(`Document not found: ${documentId}`);
      }

      if (document.teachingSessionId !== teachingSessionId) {
        throw new BadRequestException(
          `Document does not belong to teaching session: ${documentId}`,
        );
      }

      if (document.status !== 'COMPLETED' || !document.processedText?.trim()) {
        throw new BadRequestException(`Document is not ready for topic generation: ${documentId}`);
      }

      queuedDocuments.push({
        documentId,
        title: document.originFileName,
      });
    }

    return queuedDocuments;
  }

  private getProcessingDocument(generation: TopicGeneration) {
    if (!generation.sourceDocumentId) {
      return null;
    }

    const matched = generation.queuedDocuments.find(
      document => document.documentId === generation.sourceDocumentId,
    );

    if (!matched) {
      return null;
    }

    return {
      documentId: matched.documentId,
      title: matched.title,
    };
  }
}
