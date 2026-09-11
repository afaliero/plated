import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  NavigatorScreenParams,
  RouteProp,
} from "@react-navigation/native";

export type RootTabParamList = {
  Fridge: undefined;
  Recipes: NavigatorScreenParams<RecipesStackParamList> | undefined;
};

export type RecipesStackParamList = {
  Search: undefined;
  RecipeDetail: { id: string };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootTabParamList {}
  }
}

/** Convenience aliases for the hooks. */
export type RecipesStackNavigation =
  NativeStackNavigationProp<RecipesStackParamList>;

export type RecipesStackRoute<Name extends keyof RecipesStackParamList> =
  RouteProp<RecipesStackParamList, Name>;
