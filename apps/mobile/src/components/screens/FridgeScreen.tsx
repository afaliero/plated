import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header } from "src/components/core/Header";
import { Screen } from "src/components/core/Screen";
import { SearchBar } from "src/components/core/SearchBar";
import { recordMiss, searchIngredients } from "src/search";
import { color, fontSize, fontWeight, radius, space } from "src/theme";

export function FridgeScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [fridge, setFridge] = useState<readonly string[]>([]);

  const outcome = useMemo(() => searchIngredients(query), [query]);

  function add(name: string) {
    setFridge((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setQuery("");
  }

  function addUnmatched(text: string) {
    recordMiss(text);
    add(text);
  }

  function remove(name: string) {
    setFridge((prev) => prev.filter((item) => item !== name));
  }

  const listPadding = { paddingBottom: insets.bottom + space.lg };

  return (
    <Screen style={styles.screen}>
      <Header />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="e.g. chicken, rice"
        style={styles.search}
      />

      {outcome.type === "results" ? (
        <FlatList
          data={outcome.results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.ingredient.name}
          contentContainerStyle={[styles.list, listPadding]}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => add(item.ingredient.name)}
            >
              <Text style={styles.rowTitle}>{item.ingredient.name}</Text>
              {item.matchedOn !== item.ingredient.name ? (
                <Text style={styles.rowHint}>{item.matchedOn}</Text>
              ) : null}
            </Pressable>
          )}
          ListFooterComponent={
            outcome.hasExact ? null : (
              <Pressable
                style={[styles.row, styles.addRow]}
                onPress={() => addUnmatched(outcome.addAsTyped)}
              >
                <Text style={styles.rowTitle}>Add “{outcome.addAsTyped}”</Text>
                <Text style={styles.rowHint}>
                  {outcome.results.length > 0 ? "as typed" : "not in our list"}
                </Text>
              </Pressable>
            )
          }
        />
      ) : fridge.length > 0 ? (
        <FlatList
          data={fridge}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item}
          contentContainerStyle={[styles.list, listPadding]}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => remove(item)}>
              <Text style={styles.rowTitle}>{item}</Text>
              <Text style={styles.rowHint}>tap to remove</Text>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing in here yet</Text>
          <Text style={styles.emptyBody}>
            Search above to add your first ingredient.
          </Text>
        </View>
      )}
    </Screen>
  );
}

FridgeScreen.displayName = "FridgeScreen";

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: space.lg,
  },
  search: {
    marginTop: space.sm,
  },
  list: {
    paddingTop: space.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  addRow: {
    marginTop: space.md,
    borderBottomWidth: 0,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: color.brandSubtle,
  },
  rowTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    color: color.text,
  },
  rowHint: {
    fontSize: fontSize.xs,
    color: color.textMuted,
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
