import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colors, gradients, radii } from "@/lib/theme";

export function FormField({
  icon: Icon,
  trailing,
  ...rest
}: TextInputProps & {
  icon: LucideIcon;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Icon size={16} color={colors.mutedForeground} />
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        {...rest}
      />
      {trailing}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primaryBtn, disabled && styles.disabled]}
      >
        <Text style={styles.primaryBtnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.outlineBtn}>
      <Text style={styles.outlineBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
    padding: 0,
  },
  primaryBtn: {
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  outlineBtn: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  pressed: {
    opacity: 0.95,
  },
  disabled: {
    opacity: 0.5,
  },
});
