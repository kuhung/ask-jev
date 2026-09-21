// 前端业务交互模式
export type DecisionMode = 'yes_no' | 'choice' | 'score';

// 前端传给 Next.js 服务端的请求结构
export interface JevDecisionRequest {
  question: string;
  mode: DecisionMode;
  context?: string;
  options?: string[];
  timestamp?: number;
}

// Next.js 服务端返回给前端的统一渲染数据
export interface JevDecisionData {
  mode: DecisionMode;
  verdict: string;
  verdictTag: string;
  badgeClass: 'red' | 'green' | 'gold';
  score?: number | null;
  confidence?: number;
  probability?: number;
  reasoning: string;
  signId: string | number;
  rawAnswer?: any;
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

// ============================================================================
// TypeSafe 官方 System One API 严格类型契约 (POST https://api.typesafe.ai/v1/systemone)
// 依据官方文档: https://docs.typesafe.ai/api
// ============================================================================

export interface TypeSafeNoulQuestion {
  type: 'noul';
  instructions: string | Record<string, any> | any[];
  criteria?: {
    true?: string | Record<string, any> | any[];
    false?: string | Record<string, any> | any[];
  };
}

export interface TypeSafeChoiceQuestion {
  type: 'choice';
  instructions: string | Record<string, any> | any[];
  criteria: Record<string, string | Record<string, any> | any[] | null>;
}

export interface TypeSafeScoreQuestion {
  type: 'score';
  instructions: string | Record<string, any> | any[];
  criteria: (string | Record<string, any> | any[])[];
}

export type TypeSafeQuestion =
  | TypeSafeNoulQuestion
  | TypeSafeChoiceQuestion
  | TypeSafeScoreQuestion;

export interface TypeSafeSystemOneRequest {
  state: string | Record<string, any> | any[];
  model: 'jev-latest' | 'jev-preview' | string;
  questions: Record<string, TypeSafeQuestion>;
}

export interface TypeSafeNoulAnswer {
  type: 'noul';
  noul: number; // 0 (no) 到 1 (yes)
}

export interface TypeSafeChoiceAnswer {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface TypeSafeScoreAnswer {
  type: 'score';
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
}

export type TypeSafeAnswer =
  | TypeSafeNoulAnswer
  | TypeSafeChoiceAnswer
  | TypeSafeScoreAnswer;

export interface TypeSafeSystemOneResponse {
  model: string;
  answers: Record<string, TypeSafeAnswer>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
