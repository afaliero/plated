import { StyleSheet, Text, View } from "react-native";
import { color, fontSize, fontWeight, space } from "src/theme";
import { Header } from "src/components/core/Header";
import { Screen } from "src/components/core/Screen";

export function FridgeScreen() {
  return (
    <Screen edges={["top", "left", "right", "bottom"]} style={styles.screen}>
      <Header />
      <Text style={styles.heading}>My fridge</Text>
      <Text style={styles.subheading}>
        Everything you have on hand, ready to cook with.
      </Text>

      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nothing in here yet</Text>
        <Text style={styles.emptyBody}>
          Add ingredients and they&apos;ll show up here.
        </Text>
      </View>
    </Screen>
  );
}

FridgeScreen.displayName = "FridgeScreen";

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: space.lg,
  },
  heading: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: color.text,
    marginTop: space.lg,
  },
  subheading: {
    fontSize: fontSize.sm,
    color: color.textMuted,
    marginTop: space.xs,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: color.text,
  },
  emptyBody: { fontSize: fontSize.xs, color: color.textMuted },
});
