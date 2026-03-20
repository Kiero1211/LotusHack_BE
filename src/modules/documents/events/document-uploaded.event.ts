export class DocumentUploadedEvent {
  batchId: string;
  documents: {
    docId: string;
    file: Express.Multer.File;
  }[];
}
