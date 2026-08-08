import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Plus, Send, Sparkles, FileText, AlertCircle } from "lucide-react-native";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, gradients, radii } from "@/lib/theme";
import { chatWithContract, getChatHistory, ChatHistoryItem } from "@/lib/api/chat";
import { listContracts, ContractListItem } from "@/lib/api/contracts";
import { ApiError } from "@/lib/api/client";

interface Msg {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
  sources?: any[];
}

const suggestedQuestions = [
  "What are my rights if the vendor is acquired?",
  "Can I negotiate the auto-renewal clause?",
  "What happens to my data after termination?",
  "Is the liability cap enforceable in India?",
  "Can the landlord terminate this agreement early?",
];

export default function ChatScreen() {
  const { contractId: paramContractId } = useLocalSearchParams<{ contractId?: string }>();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Choose contract: param > first available
  useEffect(() => {
    if (paramContractId) {
      setSelectedContractId(paramContractId as string);
    }
  }, [paramContractId]);

  async function loadContractsAndSelect() {
    try {
      const list = await listContracts();
      setContracts(list);
      if (!selectedContractId && !paramContractId && list.length > 0) {
        setSelectedContractId(list[0].id);
      }
    } catch (e) {
      console.log("Load contracts for chat failed", e);
    }
  }

  async function loadHistory(contractId: string) {
    if (!contractId) return;
    setLoadingHistory(true);
    setError(null);
    try {
      const history = await getChatHistory(contractId);
      const msgs: Msg[] = history.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "ai",
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: m.sources,
      }));

      if (msgs.length === 0) {
        // Add welcome message
        msgs.push({
          id: "welcome",
          role: "ai",
          text: `Hi 👋 I'm NeedhiAI, your legal assistant. I can explain clauses, risks, and answer questions about "${contracts.find(c=>c.id===contractId)?.title || "your contract"}" in plain English. This uses real RAG: contract chunks + legal knowledge base. What would you like to know?`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }

      setMessages(msgs);
    } catch (e: any) {
      console.log("Load chat history error:", e);
      // Set welcome anyway
      setMessages([
        {
          id: "welcome",
          role: "ai",
          text: "Hi 👋 I'm NeedhiAI. Ask me anything about your contracts. I use real RAG to retrieve relevant clauses and legal knowledge. Please upload a contract first if you haven't.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      if (e instanceof ApiError && e.status === 0) {
        setError("Cannot connect to backend for chat history");
      }
    } finally {
      setLoadingHistory(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadContractsAndSelect();
    }, [])
  );

  useEffect(() => {
    if (selectedContractId) {
      loadHistory(selectedContractId);
    }
  }, [selectedContractId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  async function send(text: string) {
    if (!text.trim()) return;
    if (!selectedContractId) {
      setError("No contract selected. Please upload a contract first.");
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Msg = { id: `${Date.now()}-u`, role: "user", text, time: now };
    setMessages((current) => [...current, userMsg]);
    setInput("");
    setTyping(true);
    setError(null);

    try {
      const result = await chatWithContract(selectedContractId, text);
      const aiMsg: Msg = {
        id: result.id,
        role: "ai",
        text: result.ai_response,
        time: new Date(result.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: result.sources,
      };
      setMessages((current) => [...current, aiMsg]);
    } catch (e: any) {
      console.log("Chat error:", e);
      let msg = e.message || "Failed to get response";
      if (e instanceof ApiError && e.status === 0) {
        msg = "Backend unavailable. Ensure server is running.";
      }
      setError(msg);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-err`,
          role: "ai",
          text: `Sorry, I couldn't process your question: ${msg}`,
          time: now,
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={88}>
      <ScreenHeader
        title="Legal Assistant"
        subtitle={selectedContract ? selectedContract.title : "Ask anything about your contracts"}
        right={
          <Pressable style={styles.plusBtn} onPress={() => router.push("/(tabs)/history")}>
            <FileText size={14} color={colors.foreground} />
          </Pressable>
        }
      />

      {selectedContractId ? (
        <View style={styles.contractBadge}>
          <Text style={styles.contractBadgeText} numberOfLines={1}>
            Chatting about: {selectedContract?.title || selectedContractId.slice(0, 8)}
          </Text>
        </View>
      ) : (
        <View style={styles.noContractWarning}>
          <AlertCircle size={14} color={colors.warningForeground} />
          <Text style={styles.noContractText}>No contract selected. Upload one to enable grounded RAG chat.</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loadingHistory ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading chat history from database...</Text>
        </View>
      ) : (
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {messages.map((message) => (
            <View key={message.id} style={[styles.row, message.role === "user" && styles.rowUser]}>
              {message.role === "ai" ? (
                <LinearGradient colors={gradients.primary} style={styles.aiAvatar}>
                  <Sparkles size={16} color={colors.gold} />
                </LinearGradient>
              ) : null}
              <View style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.aiBubble]}>
                <FormattedText text={message.text} isUser={message.role === "user"} />
                {message.sources && message.sources.length > 0 && message.role === "ai" && (
                  <View style={styles.sourcesBox}>
                    <Text style={styles.sourcesTitle}>Sources:</Text>
                    {message.sources.slice(0, 2).map((src: any, idx: number) => (
                      <Text key={idx} style={styles.sourceText} numberOfLines={2}>
                        • {src.type === "contract" ? "Contract" : "Legal KB"}: {src.title} - {src.content?.slice(0, 100)}...
                      </Text>
                    ))}
                  </View>
                )}
                <Text style={[styles.time, message.role === "user" && styles.timeUser]}>{message.time}</Text>
              </View>
            </View>
          ))}

          {typing ? (
            <View style={styles.row}>
              <LinearGradient colors={gradients.primary} style={styles.aiAvatar}>
                <Sparkles size={16} color={colors.gold} />
              </LinearGradient>
              <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={styles.typingDot} />
                  ))}
                </View>
                <Text style={styles.typingText}>RAG: retrieving contract chunks + legal knowledge + LLM...</Text>
              </View>
            </View>
          ) : null}

          {messages.length <= 1 ? (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsTitle}>Try asking (real RAG examples)</Text>
              <View style={styles.suggestionWrap}>
                {suggestedQuestions.map((question) => (
                  <Pressable key={question} onPress={() => send(question)} style={styles.suggestionChip}>
                    <Text style={styles.suggestionText}>{question}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={selectedContractId ? "Message NeedhiAI about this contract…" : "Upload a contract first…"}
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
          onSubmitEditing={() => send(input)}
          editable={!!selectedContractId && !typing}
        />
        <Pressable onPress={() => send(input)} disabled={!input.trim() || !selectedContractId || typing} style={styles.sendBtn}>
          <LinearGradient colors={gradients.primary} style={styles.sendGradient}>
            {typing ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Send size={16} color={colors.primaryForeground} />}
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.disclaimerFooter}>
        <Text style={styles.disclaimerText}>Real pipeline: Contract Vector Search → Legal Knowledge RAG → Grounded LLM response with sources. Not legal advice.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function FormattedText({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
      {text.split(/(\*\*[^*]+\*\*)/g).map((chunk, index) => {
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
          return (
            <Text key={index} style={styles.bold}>
              {chunk.slice(2, -2)}
            </Text>
          );
        }
        return chunk;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  plusBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  contractBadge: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  contractBadgeText: { fontSize: 12, color: colors.primary, fontWeight: "500" },
  noContractWarning: {
    marginHorizontal: 20,
    marginVertical: 8,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(212,160,23,0.1)",
    borderRadius: radii.md,
    padding: 10,
    alignItems: "center",
  },
  noContractText: { flex: 1, fontSize: 12, color: colors.warningForeground },
  errorBox: { marginHorizontal: 20, marginBottom: 8, backgroundColor: "rgba(220,76,76,0.1)", borderRadius: radii.md, padding: 10 },
  errorText: { fontSize: 12, color: colors.destructive },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 13, color: colors.mutedForeground },
  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 16 },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  rowUser: { flexDirection: "row-reverse" },
  aiAvatar: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  messageText: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  messageTextUser: { color: colors.primaryForeground },
  bold: { fontWeight: "600" },
  time: { marginTop: 4, fontSize: 10, color: colors.mutedForeground },
  timeUser: { color: "rgba(250,249,247,0.6)" },
  typingBubble: { paddingVertical: 14, gap: 6 },
  typingDots: { flexDirection: "row", gap: 4 },
  typingDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedForeground,
  },
  typingText: { fontSize: 10, color: colors.mutedForeground },
  sourcesBox: { marginTop: 8, padding: 8, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  sourcesTitle: { fontSize: 10, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase", marginBottom: 4 },
  sourceText: { fontSize: 10, color: colors.mutedForeground, lineHeight: 14 },
  suggestions: { marginTop: 8 },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  suggestionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: { fontSize: 12, color: colors.foreground },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: { flex: 1, fontSize: 14, color: colors.foreground, paddingVertical: 8 },
  sendBtn: { opacity: 1 },
  sendGradient: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimerFooter: { paddingHorizontal: 20, paddingBottom: 12 },
  disclaimerText: { fontSize: 10, color: colors.mutedForeground, textAlign: "center", lineHeight: 14 },
});
