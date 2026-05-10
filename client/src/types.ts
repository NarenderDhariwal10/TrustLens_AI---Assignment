export type ClaimStatus =
  | "VERIFIED"
  | "INACCURATE"
  | "FALSE"
  | "INSUFFICIENT_DATA";

export interface SourceLink {
  title: string;
  url: string;
  snippet?: string;
}

export interface VerificationResultItem {
  claim: string;
  type: string;
  keywords: string[];
  status: ClaimStatus;
  confidence: number;
  actualData: string;
  reasoning: string;
  sources: SourceLink[];
}

export interface VerifyStats {
  total: number;
  verified: number;
  inaccurate: number;
  false: number;
  insufficient: number;
}

export interface VerifyResponse {
  filename: string;
  uploadedAt: string;
  pages?: number;
  textPreview?: string;
  claimsExtracted: number;
  claimsVerified: number;
  truthScore: number;
  summary: string;
  stats: VerifyStats;
  majorIssues: string[];
  results: VerificationResultItem[];
}
