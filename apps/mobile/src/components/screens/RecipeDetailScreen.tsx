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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RecipeDetail } from "@plated/shared";
import { getRecipe } from "src/api/client";
import { Screen } from "src/components/core/Screen";
import type { RootStackNavigation, RootStackRoute } from "src/navigation/types";
import { color, fontSize, fontWeight, radius, space } from "src/theme";

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
  const insets = useSafeAreaInsets();
  const { id } = params;

  /**
   * One state object tagged with the id it belongs to.
   *
   * Tagging is what lets us derive "loading" during render instead of calling
   * setLoading(true) in the effect body — a synchronous setState in an effect
   * triggers a cascading render, which react-hooks/set-state-in-effect flags.
   * When `id` changes, `loaded.id` no longer matches and we're loading again,
   * with no extra render.
   */
  const [loaded, setLoaded] = useState<{
    id: string;
    recipe: RecipeDetail | null;
    error: string | null;
  } | null>(null);

  const settled = loaded?.id === id ? loaded : null;
  const loading = settled === null;
  const recipe = settled?.recipe ?? null;
  const error = settled?.error ?? null;

  useEffect(() => {
    // Guards against a stale response overwriting a newer one if the id
    // changes while a request is still in flight.
    let active = true;

    getRecipe(id)
      .then((result) => {
        if (active) setLoaded({ id, recipe: result, error: null });
      })
      .catch((e: unknown) => {
        if (active) {
          setLoaded({
            id,
            recipe: null,
            error: e instanceof Error ? e.message : "Something went wrong.",
          });
        }
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
      <Screen edges={["top", "left", "right", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error || !recipe) {
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <View style={styles.centered}>
          <Text style={styles.error}>{error ?? "Recipe not found."}</Text>
        </View>
      </Screen>
    );
  }

  const meta = [
    recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : null,
    recipe.servings ? `Serves ${recipe.servings}` : null,
    recipe.sourceName,
  ].filter(Boolean);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
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
            {"This source didn't provide steps."}
            {recipe.sourceUrl ? " Check the original recipe." : ""}
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.bg,
    padding: space.xl,
  },
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.xs,
    backgroundColor: color.bg,
  },
  hero: {
    width: "100%",
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    marginBottom: space.md,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  meta: {
    fontSize: fontSize.sm,
    color: color.textMuted,
    marginBottom: space.sm,
  },
  sectionHeading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: color.text,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  listItem: { fontSize: fontSize.md, lineHeight: 24, color: color.textBody },
  step: {
    fontSize: fontSize.md,
    lineHeight: 24,
    color: color.textBody,
    marginBottom: space.sm,
  },
  stepNumber: { fontWeight: fontWeight.bold, color: color.brand },
  error: {
    color: color.danger,
    fontSize: fontSize.md,
    textAlign: "center",
  },
});
