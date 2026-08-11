import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

/**
 * The route table's type contract: route name -> params for that route.
 *
 * This is the single source of truth for navigation type-safety. Adding a
 * route here makes `navigate("...")` accept it and forces you to pass the
 * right params; `undefined` means the route takes none.
 */
export type RootStackParamList = {
  Search: undefined;
  RecipeDetail: { id: string };
};

/**
 * Makes a bare `useNavigation()` typed anywhere in the app, with no generic
 * at the call site. Without this the hook falls back to a loose param list
 * and `navigate("Typo")` compiles fine.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

/** Convenience aliases for the hooks. */
export type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;

export type RootStackRoute<Name extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  Name
>;
