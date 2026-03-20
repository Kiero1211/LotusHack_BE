import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document, DocumentStatus } from './schemas/document.schema';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(@InjectModel(Document.name) private readonly documentModel: Model<Document>) {}

  async createDocument(data: {
    userId: string;
    originFileName: string;
    batchId: string;
    mimeType: string;
  }) {
    const doc = new this.documentModel({ ...data, status: DocumentStatus.PENDING });
    return doc.save();
  }

  async updateDocumentStatus(id: string, status: DocumentStatus, extra: Partial<Document> = {}) {
    return this.documentModel
      .findByIdAndUpdate(id, { status, ...extra }, { returnDocument: 'after' })
      .exec();
  }

  async getDocumentsByBatchId(batchId: string) {
    return this.documentModel.find({ batchId }).exec();
  }

  async getDocumentsByUser(userId: string) {
    return this.documentModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
