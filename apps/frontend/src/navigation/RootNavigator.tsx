import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FridgeScreen } from "src/components/screens/FridgeScreen";
import { RecipeDetailScreen } from "src/components/screens/RecipeDetailScreen";
import { SearchScreen } from "src/components/screens/SearchScreen";
import type { RootStackParamList } from "src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Fridge"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Fridge"
        component={FridgeScreen}
        // options={{ title: "My fridge" }}
      />
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
