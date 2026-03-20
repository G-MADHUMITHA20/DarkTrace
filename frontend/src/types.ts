export type InputKind = "url" | "email";

export type ThreatClass = "Legitimate" | "Suspicious" | "Phishing";

export type WhoisData = {
  domain: string;
  registrant: string;
  creationDate: string;
  expirationDate: string;
  age_days: number;
} | null;

export type ThreatIntelData = {
  domain: string;
  isKnownMalicious: boolean;
  abuseReports: number;
  lastDetection: string | null;
  threatTypes: string[];
  overallThreatScore: number;
  source?: string;
} | null;

export type EmailParsedData = {
  subject: string;
  from: string;
  linkCount: number;
  attachmentCount: number;
  hasReplyToMismatch: boolean;
} | null;

export type Alert = {
  id: string;
  scanResultId: string;
  alertType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  createdAt: string;
};

export type DetectionResult = {
  id: string;
  kind: InputKind;
  input: string;
  riskScore: number;
  classification: ThreatClass;
  reasons: string[];
  features: string[];
  latencyMs: number;
  processedAt: string;
  mlConfidence?: number;
  whoisData?: WhoisData;
  threatIntelData?: ThreatIntelData;
  emailParsedData?: EmailParsedData;
  alerts?: Alert[];
};

export type SummaryStats = {
  totalScans: number;
  phishingDetected: number;
  suspiciousDetected: number;
  avgLatencyMs: number;
};

export type AppState = {
  summary: SummaryStats;
  recentResults: DetectionResult[];
};

export type BootstrapResponse = {
  state: AppState;
};

export type DashboardHistoryResponse = {
  results: DetectionResult[];
  count: number;
};

export type DashboardAlertsResponse = {
  alerts: Alert[];
  count: number;
};
