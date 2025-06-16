import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

export const register = (email: string, password: string) =>
  api.post("/auth/register", { email, password });

export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

// Conversation management
export const getConversations = (token: string) =>
  api.get("/api/conversations", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getConversation = (conversationId: string, token: string) =>
  api.get(`/api/conversations/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createConversation = (title: string, token: string) =>
  api.post(
    "/api/conversations",
    { title },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const updateConversationTitle = (
  conversationId: string,
  title: string,
  token: string
) =>
  api.put(
    `/api/conversations/${conversationId}`,
    { title },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const deleteConversation = (conversationId: string, token: string) =>
  api.delete(`/api/conversations/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Chat in a specific conversation
export const sendMessageToConversation = (
  conversationId: string,
  message: string,
  token: string
) =>
  api.post(
    `/api/conversations/${conversationId}/chat`,
    { message },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const executeCodeInConversation = (
  conversationId: string,
  code: string,
  token: string,
  languageId?: number
) =>
  api.post(
    `/api/conversations/${conversationId}/execute`,
    { code, languageId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

// Legacy endpoints (for backward compatibility)
export const sendMessage = (
  message: string,
  token: string,
  history: string = "",
  conversationId?: string
) =>
  api.post(
    "/api/chat",
    { message, history, conversationId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const executeCode = (code: string, token: string, conversationId?: string, languageId?: number) =>
  api.post(
    "/api/execute",
    { code, conversationId, languageId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export default api;
