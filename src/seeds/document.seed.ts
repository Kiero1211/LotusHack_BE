import { Model, Types } from 'mongoose';
import { Document, DocumentStatus } from 'src/modules/documents/schemas/document.schema';
import { USER_IDS } from './user.seed';
import { TEACHING_SESSION_IDS } from './teaching-session.seed';

export const DOCUMENT_IDS = {
  aliceDoc1: new Types.ObjectId('64f1a2b3c4d5e6f7a8b9c001'),
  aliceDoc2: new Types.ObjectId('64f1a2b3c4d5e6f7a8b9c002'),
  bobDoc1: new Types.ObjectId('64f1a2b3c4d5e6f7a8b9c003'),
};

export async function seedDocuments(documentModel: Model<Document>): Promise<void> {
  const documents = [
    {
      _id: DOCUMENT_IDS.aliceDoc1,
      userId: USER_IDS.alice.toString(),
      teachingSessionId: TEACHING_SESSION_IDS.alicePhotosynthesis.toString(),
      originFileName: 'biology-chapter-5.pdf',
      batchId: 'batch-001',
      mimeType: 'application/pdf',
      status: DocumentStatus.COMPLETED,
      processedText:
        'Photosynthesis occurs in two main stages: the light-dependent reactions in the thylakoid membrane and the Calvin cycle in the stroma. Chlorophyll absorbs red and blue light while reflecting green light.',
      errorMessage: null,
    },
    {
      _id: DOCUMENT_IDS.aliceDoc2,
      userId: USER_IDS.alice.toString(),
      teachingSessionId: TEACHING_SESSION_IDS.alicePhotosynthesis.toString(),
      originFileName: 'ml-notes.docx',
      batchId: 'batch-002',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      status: DocumentStatus.PROCESSING,
      processedText: null,
      errorMessage: null,
    },
    {
      _id: DOCUMENT_IDS.bobDoc1,
      userId: USER_IDS.bob.toString(),
      teachingSessionId: TEACHING_SESSION_IDS.bobNewton.toString(),
      originFileName: 'physics-lecture.pdf',
      batchId: 'batch-003',
      mimeType: 'application/pdf',
      status: DocumentStatus.FAILED,
      processedText: null,
      errorMessage: 'Failed to parse PDF: file may be corrupted or password-protected.',
    },
  ];

  await documentModel.deleteMany({});
  await documentModel.insertMany(documents);
  console.log(`Seeded ${documents.length} documents`);
}
