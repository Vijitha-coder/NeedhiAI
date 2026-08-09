import { apiRequest } from "./client";
import { Platform } from "react-native";

export interface ContractListItem {
  id: string;
  title: string;
  type: string;
  file_name: string;
  status: string;
  risk_level: string; // low, medium, high
  risk_score: number;
  pages: number;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface RiskItem {
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
  clause_reference?: string;
  evidence?: string;
  category?: string;
}

export interface ClauseItem {
  title: string;
  content: string;
  type: string;
  page_reference?: string;
  risk_level?: string;
}

export interface DeadlineItem {
  description: string;
  date?: string;
  clause_reference?: string;
  importance?: string;
}

export interface ContractAnalysisResponse {
  contract_id: string;
  title: string;
  risk_level: string;
  risk_score: number;
  summary: string;
  key_clauses: ClauseItem[];
  risks: RiskItem[];
  rights: string[];
  obligations: string[];
  penalties: string[];
  deadlines: DeadlineItem[];
  pros: string[];
  cons: string[];
  renewal: string[];
  termination: string[];
  payment_clauses: string[];
  missing_clauses: string[];
  sources: any[];
  warnings: string[];
}

export interface ContractDetailResponse {
  id: string;
  title: string;
  type: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  pages: number;
  risk_level: string;
  risk_score: number;
  summary: string;
  extracted_text_preview: string;
  analysis?: ContractAnalysisResponse;
  created_at: string;
  updated_at: string;
}

export interface ContractUploadResponse {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  status: string;
  pages: number;
  created_at: string;
}

export interface ContractStatusResponse {
  id: string;
  status: string;
  progress: number;
  message: string;
}

export async function uploadContract(
  fileUri: string,
  fileName: string,
  mimeType: string,
  title?: string,
  onProgress?: (progress: number) => void
): Promise<ContractUploadResponse> {
  const formData = new FormData();

  // Handle file differently for web vs React Native
  if (Platform.OS === "web") {
    // On web, we need to convert the URI to a File object
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append("file", file);
  } else {
    // For React Native, file object needs uri, name, type
    // @ts-ignore - React Native FormData file
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  if (title) {
    formData.append("title", title);
  }

  // Note: fetch on React Native will automatically set multipart boundary
  // We use apiRequest with isFormData=true
  const response = await apiRequest<ContractUploadResponse>("/contracts/upload", {
    method: "POST",
    body: formData,
    isFormData: true,
  });

  return response;
}

export async function listContracts(): Promise<ContractListItem[]> {
  return await apiRequest<ContractListItem[]>("/contracts", {
    method: "GET",
  });
}

export async function getContract(contractId: string): Promise<ContractDetailResponse> {
  return await apiRequest<ContractDetailResponse>(`/contracts/${contractId}`, {
    method: "GET",
  });
}

export async function getContractStatus(contractId: string): Promise<ContractStatusResponse> {
  return await apiRequest<ContractStatusResponse>(`/contracts/${contractId}/status`, {
    method: "GET",
  });
}

export async function analyzeContract(contractId: string): Promise<ContractAnalysisResponse> {
  return await apiRequest<ContractAnalysisResponse>(`/contracts/${contractId}/analyze`, {
    method: "POST",
  });
}

export async function deleteContract(contractId: string): Promise<void> {
  await apiRequest(`/contracts/${contractId}`, {
    method: "DELETE",
  });
}

// Helper to map backend risk level to frontend RiskBadge level
export function mapRiskLevel(backendLevel: string): "low" | "medium" | "high" {
  const lower = backendLevel.toLowerCase();
  if (lower === "high") return "high";
  if (lower === "medium") return "medium";
  return "low";
}
