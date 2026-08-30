import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import SearchIcon from "src/assets/icons/search.svg";
import { color, fontSize, radius, space } from "src/theme";

type SearchBarProps = Pick<
  TextInputProps,
  | "autoCapitalize"
  | "autoCorrect"
  | "autoFocus"
  | "onBlur"
  | "onFocus"
  | "onSubmitEditing"
  | "returnKeyType"
> & {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search",
  style,
  ...input
}: SearchBarProps) {
  return (
    <View style={[styles.bar, style]}>
      <SearchIcon width={20} height={20} color={color.textPlaceholder} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.textPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        // iOS only; Android shows nothing, so give it an explicit control if
        // clearing ever needs to work there.
        clearButtonMode="while-editing"
        {...input}
      />
    </View>
  );
}

SearchBar.displayName = "SearchBar";

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    height: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
  },
  input: {
    flex: 1,
    fontSize: fontSize.lg,
    color: color.text,
    // Android gives TextInput its own vertical padding, which breaks centering
    // against the fixed bar height.
    paddingVertical: 0,
  },
});
