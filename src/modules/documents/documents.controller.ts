import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UnauthorizedException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DOCUMENT_ROUTES } from 'src/common/constants/route';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadDocumentsDto } from './dto/upload-documents.dto';
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

interface AuthRequest extends ExpressRequest {
  user?: { userId: string; email: string };
}

@Controller(DOCUMENT_ROUTES.BASE)
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post(DOCUMENT_ROUTES.UPLOAD)
  @UseGuards(JwtAuthGuard)
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
    @Request() req: AuthRequest,
    @Body() uploadDocumentsDto: UploadDocumentsDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('User not found in request');

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const batchId = uuidv4();
    const documentRecords: { docId: string; file: Express.Multer.File }[] = [];

    for (const file of files) {
      const doc = await this.documentsService.createDocument({
        userId,
        originFileName: file.originalname,
        batchId,
        teachingSessionId: uploadDocumentsDto.teachingSessionId,
        mimeType: file.mimetype,
      });
      documentRecords.push({ docId: doc.id, file });
    }

    this.eventEmitter.emit('documents.uploaded', { batchId, documents: documentRecords });

    return { message: 'Files accepted for processing', batchId };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyDocuments(@Request() req: AuthRequest) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('User not found in request');

    const documents = await this.documentsService.getDocumentsByUser(userId);
    return documents.map(doc => ({
      id: doc.id,
      originFileName: doc.originFileName,
      batchId: doc.batchId,
      teachingSessionId: doc.teachingSessionId,
      mimeType: doc.mimeType,
      status: doc.status,
      createdAt: doc.createdAt,
    }));
  }

  @Get(DOCUMENT_ROUTES.STATUS_BY_BATCH)
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
        teachingSessionId: doc.teachingSessionId,
        status: doc.status,
      })),
    };
  }
}
