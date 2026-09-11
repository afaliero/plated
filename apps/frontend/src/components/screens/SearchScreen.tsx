import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RecipeSummary } from "@plated/shared";
import { suggestFridgeRecipes } from "src/api/client";
import { Screen } from "src/components/core/Screen";
import { SearchBar } from "src/components/core/SearchBar";
import type { RecipesStackNavigation } from "src/navigation/types";
import { color, fontSize, fontWeight, radius, space } from "src/theme";

/** Route "Search" — ingredient input and the results list. */
export function SearchScreen() {
  const navigation = useNavigation<RecipesStackNavigation>();
  const insets = useSafeAreaInsets();

  const [preferences, setPreferences] = useState("");
  const preferencesRef = useRef(preferences);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecipes(await suggestFridgeRecipes(preferencesRef.current));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void search();
    }, [search]),
  );

  return (
    <Screen style={styles.screen}>
      <SearchBar
        style={styles.search}
        value={preferences}
        onChangeText={(value) => {
          preferencesRef.current = value;
          setPreferences(value);
        }}
        placeholder="Any preferences?"
      />

      <Pressable
        style={styles.button}
        onPress={() => void search()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Finding recipes…" : "Refresh recipes"}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator style={styles.spinner} /> : null}

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + space.lg },
        ]}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("RecipeDetail", { id: item.id })}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {item.missedCount === 0
                  ? "You have everything"
                  : `Missing ${item.missedCount}: ${item.missedIngredients
                      .map((i) => i.name)
                      .join(", ")}`}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: space.lg,
  },
  search: {
    marginTop: space.lg,
  },
  button: {
    backgroundColor: color.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: space.md,
  },
  buttonText: {
    color: color.onBrand,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  error: { color: color.danger, marginTop: space.md },
  spinner: { marginTop: space.lg },
  list: { paddingVertical: space.lg, gap: space.md },
  card: { flexDirection: "row", gap: space.md, alignItems: "center" },
  thumb: { width: 88, height: 66, borderRadius: radius.sm },
  thumbEmpty: { backgroundColor: color.surface },
  cardBody: { flex: 1, gap: space.xs },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: color.text,
  },
  cardMeta: { fontSize: fontSize.xs, color: color.textMuted },
});
