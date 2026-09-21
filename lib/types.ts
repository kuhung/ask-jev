export type DecisionMode = 'yes_no' | 'choice' | 'score';

export interface JevDecisionRequest {
  question: string;
  mode: DecisionMode;
  context?: string;
  options?: string[];
  timestamp?: number;
}

export interface JevDecisionData {
  mode: DecisionMode;
  verdict: string;
  verdictTag: string;
  badgeClass: 'red' | 'green' | 'gold';
  score?: number | null;
  reasoning: string;
  signId: string | number;
}

export interface JevDecisionResponse {
  code: number;
  data: JevDecisionData;
  message?: string;
}

export interface InspirationItem {
  q: string;
  mode: DecisionMode;
  context: string;
}
