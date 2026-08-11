import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen";
import { SearchScreen } from "../screens/SearchScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The route table.
 *
 * Each `Screen` binds a route name to the component that renders it. To add a
 * screen: add its name and params to `RootStackParamList`, then register it
 * here — navigate to it with `navigation.navigate("<name>", params)`.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Search"
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700" },
        headerTintColor: "#1f7a3d",
        contentStyle: { backgroundColor: "#fff" },
      }}
    >
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "What can I make?" }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        // Placeholder — the screen calls setOptions with the real recipe
        // title once it has loaded.
        options={{ title: "Recipe" }}
      />
    </Stack.Navigator>
  );
}
