import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  Fridge: undefined;
  Search: undefined;
  RecipeDetail: { id: string };
};

declare global {
  namespace ReactNavigation {
    // Empty body is the point — this is declaration merging, not a new type.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

/** Convenience aliases for the hooks. */
export type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;

export type RootStackRoute<Name extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  Name
>;
