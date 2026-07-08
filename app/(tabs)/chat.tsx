import { LinearGradient } from "expo-linear-gradient";
import { Plus, Send, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { initialChat, suggestedQuestions } from "@/lib/mock-data";
import { colors, gradients, radii } from "@/lib/theme";

interface Msg {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Msg[]>(initialChat);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  function send(text: string) {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((current) => [...current, { id: `${Date.now()}-u`, role: "user", text, time: now }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-a`,
          role: "ai",
          text:
            "Great question. Based on Indian contract law and the terms of your Cloudline SaaS agreement, here's what I found:\n\n**Auto-renewal clauses** are enforceable, but courts look at whether the notice period is reasonable. 90 days is on the longer end for a SaaS contract — 30 days is more common.\n\nWould you like me to draft a negotiation email?",
          time: now,
        },
      ]);
    }, 1400);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <ScreenHeader
        title="Legal Assistant"
        subtitle="Ask anything about your contracts"
        right={
          <Pressable style={styles.plusBtn}>
            <Plus size={16} color={colors.foreground} />
          </Pressable>
        }
      />

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
            </View>
          </View>
        ) : null}

        {messages.length <= 1 ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Try asking</Text>
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

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message NeedhiAI…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
          onSubmitEditing={() => send(input)}
        />
        <Pressable onPress={() => send(input)} disabled={!input.trim()} style={styles.sendBtn}>
          <LinearGradient colors={gradients.primary} style={styles.sendGradient}>
            <Send size={16} color={colors.primaryForeground} />
          </LinearGradient>
        </Pressable>
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
  typingBubble: { paddingVertical: 14 },
  typingDots: { flexDirection: "row", gap: 4 },
  typingDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedForeground,
  },
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
    marginBottom: 12,
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
});
