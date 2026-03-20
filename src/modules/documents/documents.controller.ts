import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UnauthorizedException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { UserDocument } from '../users/schema/user.schema';
import { DocumentsService } from './documents.service';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/html',
];

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocuments(
    @CurrentUser() user: UserDocument,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const batchId = uuidv4();
    const documentRecords: { docId: string; file: Express.Multer.File }[] = [];

    for (const file of files) {
      const doc = await this.documentsService.createDocument({
        userId: user?._id?.toString(),
        originFileName: file.originalname,
        batchId,
        mimeType: file.mimetype,
      });
      documentRecords.push({ docId: doc.id, file });
    }

    this.eventEmitter.emit('documents.uploaded', { batchId, documents: documentRecords });

    return { message: 'Files accepted for processing', batchId };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyDocuments(@CurrentUser() user: UserDocument) {
    const userId = user?._id?.toString();
    if (!userId) throw new UnauthorizedException('User not found in request');

    const documents = await this.documentsService.getDocumentsByUser(userId);
    return documents.map(doc => ({
      id: doc.id,
      originFileName: doc.originFileName,
      batchId: doc.batchId,
      mimeType: doc.mimeType,
      status: doc.status,
      createdAt: doc.createdAt,
    }));
  }

  @Get('status/:batchId')
  async getBatchStatus(@Param('batchId') batchId: string) {
    const documents = await this.documentsService.getDocumentsByBatchId(batchId);
    if (!documents || documents.length === 0) {
      throw new BadRequestException('Batch ID not found');
    }

    return {
      batchId,
      documents: documents.map(doc => ({
        id: doc.id,
        originFileName: doc.originFileName,
        status: doc.status,
      })),
    };
  }

  @Post('ping')
  @UseGuards(JwtAuthGuard)
  async ping() {
    return { message: 'pong' };
  }
}
