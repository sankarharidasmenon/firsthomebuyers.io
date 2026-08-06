export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  schemes?: string[]; // IDs of referenced schemes
  followUps?: string[];
}

export interface EligibilityContext {
  state?: string;
  income?: number;
  targetPropertyPrice?: number;
  deposit?: number;
  isFirstHomeBuyer?: boolean;
  citizenship?: string;
  relationshipStatus?: string;
  dependents?: number;
  propertyType?: string;
  eligibleSchemes?: string[]; // IDs or names
  ineligibleSchemes?: string[]; // IDs or names
}

export interface ChatRequestOptions {
  message: string;
  history: ChatMessage[];
  eligibilityProfile?: EligibilityContext;
}

export interface AIResponse {
  answer: string;
  referencedSchemes: string[];
  followUps: string[];
}

/**
 * Interface for AI providers to allow switching between Gemini, OpenAI, Claude, etc.
 */
export interface AIProvider {
  /**
   * Generates a streaming chat response.
   * Note: We return a standard web ReadableStream.
   */
  generateChatStream(
    options: ChatRequestOptions,
    contextSchemes: any[]
  ): Promise<ReadableStream<Uint8Array>>;
}
