import { Image, StyleSheet, View } from "react-native";
import { images } from "src/assets/images";
import { space } from "src/theme";

export function Header() {
  return (
    <View style={styles.bar}>
      <Image
        source={images.logo}
        style={styles.logo}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="plated"
      />
    </View>
  );
}

Header.displayName = "Header";

const styles = StyleSheet.create({
  bar: {
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  logo: { height: 40, aspectRatio: 3},
});
