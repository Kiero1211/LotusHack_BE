import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { DocumentsService } from './documents.service';
import { DocxParser } from './parsers/docx.parser';
import { PdfParser } from './parsers/pdf.parser';
import { DocumentStatus } from './schemas/document.schema';

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfParser: PdfParser,
    private readonly docxParser: DocxParser,
  ) {}

  async processDocument(docId: string, file: Express.Multer.File) {
    try {
      await this.documentsService.updateDocumentStatus(docId, DocumentStatus.PROCESSING);
      this.logger.log(`Processing document ${docId}`);

      let extractedText = '';

      if (file.mimetype === 'application/pdf') {
        extractedText = await this.pdfParser.parse(file.path);
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        extractedText = await this.docxParser.parse(file.path);
      } else if (['text/plain', 'text/markdown', 'text/html'].includes(file.mimetype)) {
        extractedText = fs.readFileSync(file.path, 'utf-8');
      } else {
        throw new Error(`Unsupported mime type: ${file.mimetype}`);
      }

      await this.documentsService.updateDocumentStatus(docId, DocumentStatus.COMPLETED, {
        processedText: extractedText,
      });
      this.logger.log(`Successfully processed document ${docId}`);
    } catch (error) {
      this.logger.error(`Failed to process document ${docId}: ${(error as Error).message}`);
      await this.documentsService.updateDocumentStatus(docId, DocumentStatus.FAILED, {
        errorMessage: (error as Error).message,
      });
    } finally {
      // Unconditionally delete the local file
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          this.logger.log(`Deleted physical file ${file.path}`);
        }
      } catch (unlinkError) {
        this.logger.error(
          `Failed to delete physical file ${file.path}: ${(unlinkError as Error).message}`,
        );
      }
    }
  }
}
