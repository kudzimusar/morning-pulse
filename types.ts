// Global variable declarations injected by the environment
declare global {
  interface Window {
    __app_id?: string;
    __firebase_config?: string;
    __initial_auth_token?: string;
  }
}

export interface NewsStory {
  id: string;
  headline: string;
  detail: string;
  source: string;
  category: string;
  url?: string;
  urlToImage?: string;
  date?: string;
  timestamp?: number;
}

export interface PollData {
  id: string;
  question: string;
  options: Record<string, number>;
  voters: Record<string, string>; // userId -> optionKey
  totalVotes: number;
  timestamp: number;
}

export interface UserPreferences {
  isPremium: boolean;
  alertKeywords: string[];
}

export type SenderType = 'user' | 'bot' | 'system';

export type MessageType = 'text' | 'news-feed' | 'poll';

export interface Message {
  id: string;
  text?: string;
  html?: string; // For rich text answers
  sender: SenderType;
  type: MessageType;
  timestamp: number;
  data?: any; // For holding Poll or News data locally if needed
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// Opinion & Editorial Types
export interface Opinion {
  id: string;
  writerType: string;
  authorName: string;
  authorTitle?: string;
  headline: string;
  subHeadline: string;
  body: string;
  imageUrl?: string;
  category?: string;
  country?: string;
  status: 'pending' | 'published' | 'rejected';
  submittedAt: Date;
  publishedAt?: Date | null;
  reviewedBy?: string;
}

export interface OpinionSubmissionData {
  writerType?: string;
  authorName: string;
  authorTitle?: string;
  headline: string;
  subHeadline: string;
  body: string;
  category?: string;
  country?: string;
}
