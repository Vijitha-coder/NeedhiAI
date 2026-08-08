import { apiRequest } from "./client";

export interface ChatSource {
  type: string;
  title: string;
  content: string;
  relevance?: number;
  metadata?: any;
}

export interface ChatResponse {
  id: string;
  contract_id: string;
  user_message: string;
  ai_response: string;
  sources: ChatSource[];
  created_at: string;
}

export interface ChatHistoryItem {
  id: string;
  role: "user" | "ai";
  content: string;
  sources: any[];
  created_at: string;
}

export interface ChatHistoryResponse {
  contract_id: string;
  messages: ChatHistoryItem[];
}

export async function chatWithContract(contractId: string, message: string): Promise<ChatResponse> {
  return await apiRequest<ChatResponse>(`/contracts/${contractId}/chat`, {
    method: "POST",
    body: { message },
  });
}

export async function getChatHistory(contractId: string): Promise<ChatHistoryResponse> {
  return await apiRequest<ChatHistoryResponse>(`/contracts/${contractId}/chat`, {
    method: "GET",
  });
}

// General chat without contract context - uses last contract or general assistant
// For tabs/chat.tsx, if no contract selected, we can list contracts and chat with most recent
export async function generalChat(message: string, contractId?: string): Promise<ChatResponse> {
  if (!contractId) {
    // Need to get most recent contract
    const contracts = await apiRequest<any[]>("/contracts", { method: "GET" });
    if (contracts.length === 0) {
      throw new Error("No contracts uploaded yet. Please upload a contract to start chatting.");
    }
    contractId = contracts[0].id;
  }
  return chatWithContract(contractId, message);
}
