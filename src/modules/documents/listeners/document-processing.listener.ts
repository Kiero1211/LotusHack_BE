import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DocumentUploadedEvent } from '../events/document-uploaded.event';
import { ProcessingService } from '../processing.service';

@Injectable()
export class DocumentProcessingListener {
  private readonly logger = new Logger(DocumentProcessingListener.name);

  constructor(private readonly processingService: ProcessingService) {}

  @OnEvent('documents.uploaded')
  handleDocumentUploadedEvent(event: DocumentUploadedEvent) {
    this.logger.log(`Received processing event for batch: ${event.batchId}`);

    // Process asynchronously without awaiting in the event emitter queue if we expect long running
    // We can dispatch them via ProcessingService
    for (const doc of event.documents) {
      this.processingService.processDocument(doc.docId, doc.file).catch(error => {
        this.logger.error(
          `Error initiating processing for doc ${doc.docId}: ${(error as Error).message}`,
        );
      });
    }
  }
}
