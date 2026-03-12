export type ProblemStatus = 'full' | 'partial' | 'zero' | 'none';

export interface Problem {
  id: string;
  name: string;
  section: string;
  status: ProblemStatus;
}

export interface CsesData {
  problems: Problem[];
  lastUpdated: number;
  username: string;
}

export interface Submission {
  problemId: string;
  problemName: string;
  timestamp: number;
  result: string;
}

export interface CsesSubmissions {
  entries: Submission[];
}
