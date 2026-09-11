import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header } from "src/components/core/Header";
import { Screen } from "src/components/core/Screen";
import { SearchBar } from "src/components/core/SearchBar";
import { useFridge } from "src/hooks/useFridge";
import { recordMiss, searchIngredients } from "src/search";
import { color, fontSize, fontWeight, radius, space } from "src/theme";

export function FridgeScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const {
    items: fridge,
    error,
    loading,
    saving,
    retry,
    add: saveItem,
    remove,
  } = useFridge();
  const disabled = loading || saving || fridge === null;

  const outcome = useMemo(() => searchIngredients(query), [query]);

  async function add(name: string) {
    const submittedQuery = query;
    if (await saveItem(name)) {
      setQuery((current) => (current === submittedQuery ? "" : current));
    }
  }

  function addUnmatched(text: string) {
    recordMiss(text);
    add(text);
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

      {error ? (
        <View style={styles.feedback}>
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
          {fridge === null ? (
            <Pressable
              onPress={retry}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {saving ? (
        <View style={styles.feedback}>
          <ActivityIndicator color={color.brand} />
          <Text style={styles.rowHint}>Saving…</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={color.brand} />
          <Text style={styles.emptyBody}>Loading your fridge…</Text>
        </View>
      ) : fridge === null ? null : outcome.type === "results" ? (
        <FlatList
          data={outcome.results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.ingredient.name}
          contentContainerStyle={[styles.list, listPadding]}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              disabled={disabled}
              accessibilityRole="button"
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
                disabled={disabled}
                accessibilityRole="button"
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
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, listPadding]}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => remove(item.id)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
            >
              <Text style={styles.rowTitle}>{item.name}</Text>
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
  feedback: {
    paddingTop: space.md,
    gap: space.sm,
  },
  error: { color: color.danger, fontSize: fontSize.sm },
  retry: {
    color: color.brand,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
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
