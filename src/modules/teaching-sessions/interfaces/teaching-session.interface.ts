export type ChatRole = 'user' | 'assistant';

export interface Source {
  title: string;
  content: string;
  type: string;
}

export interface Message {
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export interface Session {
  userId: string;
  title: string;
  topic?: string;
  sources: Source[];
  chatHistory: Message[];
  summary?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
