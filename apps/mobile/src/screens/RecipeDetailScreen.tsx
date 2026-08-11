import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RecipeDetail } from "@plated/shared";
import { getRecipe } from "@/api/client";
import type { RootStackNavigation, RootStackRoute } from "@/navigation/types";

/**
 * Route "RecipeDetail" — full recipe, including the cooking instructions the
 * search results deliberately don't carry.
 *
 * This is the SECOND upstream call: findByIngredients returns no steps, cook
 * time or servings, so we only pay for it when someone actually taps in.
 */
export function RecipeDetailScreen() {
  // `id` is typed from RootStackParamList — no cast, no `any`.
  const { params } = useRoute<RootStackRoute<"RecipeDetail">>();
  const navigation = useNavigation<RootStackNavigation>();
  const { id } = params;

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guards against a stale response overwriting a newer one if the id
    // changes while a request is still in flight.
    let active = true;

    setLoading(true);
    setError(null);

    getRecipe(id)
      .then((result) => {
        if (active) setRecipe(result);
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Swap the placeholder header title for the real one.
  useEffect(() => {
    if (recipe) navigation.setOptions({ title: recipe.title });
  }, [navigation, recipe]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? "Recipe not found."}</Text>
      </View>
    );
  }

  const meta = [
    recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : null,
    recipe.servings ? `Serves ${recipe.servings}` : null,
    recipe.sourceName,
  ].filter(Boolean);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.hero} />
      ) : null}

      <Text style={styles.title}>{recipe.title}</Text>
      {meta.length > 0 ? (
        <Text style={styles.meta}>{meta.join(" · ")}</Text>
      ) : null}

      <Text style={styles.sectionHeading}>Ingredients</Text>
      {recipe.ingredients.map((ingredient, i) => (
        <Text key={`${ingredient.name}-${i}`} style={styles.listItem}>
          • {ingredient.amount ?? ingredient.name}
        </Text>
      ))}

      <Text style={styles.sectionHeading}>Instructions</Text>
      {recipe.instructions.length > 0 ? (
        recipe.instructions.map((step, i) => (
          <Text key={i} style={styles.step}>
            <Text style={styles.stepNumber}>{i + 1}. </Text>
            {step}
          </Text>
        ))
      ) : (
        <Text style={styles.listItem}>
          This source didn't provide steps.
          {recipe.sourceUrl ? " Check the original recipe." : ""}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: { padding: 16, paddingBottom: 48, gap: 4 },
  hero: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  meta: { fontSize: 14, color: "#666", marginBottom: 8 },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  listItem: { fontSize: 15, lineHeight: 24, color: "#333" },
  step: { fontSize: 15, lineHeight: 24, color: "#333", marginBottom: 10 },
  stepNumber: { fontWeight: "700", color: "#1f7a3d" },
  error: { color: "#b00020", fontSize: 15, textAlign: "center" },
});
