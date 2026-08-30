import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "src/navigation/RootNavigator";
import { color } from "src/theme";

/**
 * App shell. The route table itself lives in src/navigation/RootNavigator.tsx.
 *
 * NavigationContainer must wrap the navigator exactly once, at the root.
 * Header sits outside it so it renders once, above every route.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="auto" />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
