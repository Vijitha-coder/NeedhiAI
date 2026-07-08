import { Bell, CalendarClock, ShieldAlert, Sparkles } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { notifications } from "@/lib/mock-data";
import { colors, radii, shadows } from "@/lib/theme";

const iconMap = {
  deadline: { Icon: CalendarClock, bg: "rgba(220,76,76,0.12)", color: colors.destructive },
  analysis: { Icon: ShieldAlert, bg: colors.primarySoft, color: colors.primary },
  tip: { Icon: Sparkles, bg: "rgba(212,168,83,0.2)", color: colors.goldForeground },
} as const;

export default function NotificationsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Notifications" back="/(tabs)/home" />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          body="Deadline reminders and AI insights will appear here."
        />
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => {
            const { Icon, bg, color } = iconMap[notification.kind];
            return (
              <View key={notification.id} style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                  <Icon size={20} color={color} />
                </View>
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{notification.title}</Text>
                    <Text style={styles.time}>{notification.time}</Text>
                  </View>
                  <Text style={styles.text}>{notification.body}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  list: { paddingHorizontal: 20, gap: 10 },
  card: {
    flexDirection: "row",
    gap: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    ...shadows.soft,
  },
  iconWrap: {
    height: 40,
    width: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.foreground },
  time: { fontSize: 10, color: colors.mutedForeground },
  text: { marginTop: 4, fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
});
