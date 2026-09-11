import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FridgeScreen } from "src/components/screens/FridgeScreen";
import { RecipeDetailScreen } from "src/components/screens/RecipeDetailScreen";
import { SearchScreen } from "src/components/screens/SearchScreen";
import type {
  RecipesStackParamList,
  RootTabParamList,
} from "src/navigation/types";
import { color, fontSize, fontWeight } from "src/theme";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RecipesStackParamList>();

function RecipesNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Search"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          headerShown: true,
          title: "Recipe",
          headerTintColor: color.brand,
        }}
      />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Fridge"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.textMuted,
        tabBarStyle: {
          backgroundColor: color.bg,
          borderTopColor: color.border,
        },
        tabBarIconStyle: { display: "none" },
        tabBarLabelStyle: {
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
        },
      }}
    >
      <Tab.Screen name="Fridge" component={FridgeScreen} />
      <Tab.Screen name="Recipes" component={RecipesNavigator} />
    </Tab.Navigator>
  );
}
