import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { RecipeSummary } from "@plated/shared";
import { suggestRecipes } from "../api/client";
import type { RootStackNavigation } from "../navigation/types";

/** Route "Search" — ingredient input and the results list. */
export function SearchScreen() {
  const navigation = useNavigation<RootStackNavigation>();

  const [input, setInput] = useState("chicken, rice, broccoli");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    try {
      setRecipes(await suggestRecipes({ ingredients: input.split(",") }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="chicken, rice, broccoli"
        autoCapitalize="none"
      />

      <Pressable style={styles.button} onPress={search} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Searching…" : "Find recipes"}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator style={styles.spinner} /> : null}

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            // Route name + params. Both are checked against
            // RootStackParamList, so a typo or a missing id won't compile.
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 16,
  },
  button: {
    backgroundColor: "#1f7a3d",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#b00020", marginTop: 12 },
  spinner: { marginTop: 16 },
  list: { paddingVertical: 16, gap: 12 },
  card: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: { width: 88, height: 66, borderRadius: 8 },
  thumbEmpty: { backgroundColor: "#eee" },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardMeta: { fontSize: 13, color: "#666" },
});
