import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentProcessingListener } from './listeners/document-processing.listener';
import { DocxParser } from './parsers/docx.parser';
import { PdfParser } from './parsers/pdf.parser';
import { ProcessingService } from './processing.service';
import { Document, DocumentSchema } from './schemas/document.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }])],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    ProcessingService,
    DocumentProcessingListener,
    PdfParser,
    DocxParser,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
