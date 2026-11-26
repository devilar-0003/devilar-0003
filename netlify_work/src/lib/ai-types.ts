/** Types shared between the AI server routes and the client components. */

export type CardKind = "qa" | "cloze" | "image";
export type GeneratedBy = "gemini" | "deterministic";

export interface GeneratedCard {
  front: string;
  back: string;
  kind: CardKind;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
}

export interface PlanDay {
  day: string;
  focus: string;
  task: string;
  minutes: number;
}

export interface StudyPlan {
  headline: string;
  rationale: string;
  days: PlanDay[];
  tips: string[];
}

export interface WeakSubject {
  subject: string;
  attempts: number;
  mastery: number; // 0-100
  lapses: number;
  due: number;
}

export interface DeckSummary {
  id: number;
  title: string;
  subject: string;
  sourceType: string;
  summary: string;
  generatedBy: GeneratedBy;
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  createdAt: string;
}

export interface StudyCard {
  id: number;
  deckId: number;
  subject: string;
  kind: CardKind;
  front: string;
  back: string;
  imageId: number | null;
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  dueAt: string;
}

export interface DeckDetail {
  id: number;
  title: string;
  subject: string;
  sourceType: string;
  summary: string;
  generatedBy: GeneratedBy;
  createdAt: string;
  imageId: number | null;
  cards: StudyCard[];
}
