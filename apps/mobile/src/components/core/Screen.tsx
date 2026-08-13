import type { ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { color } from "src/theme";

type ScreenProps = {
  children: ReactNode;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_EDGES = ["top", "left", "right"] as const;

export function Screen({
  children,
  edges = DEFAULT_EDGES,
  style,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

Screen.displayName = "Screen";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
});
