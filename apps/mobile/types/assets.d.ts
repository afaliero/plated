/**
 * Module declarations for imported asset files.
 *
 * Nothing in expo/types declares these, so without this file
 * `import logo from "src/assets/logo.png"` is a type error.
 */

declare module "*.png" {
  import type { ImageSourcePropType } from "react-native";
  const content: ImageSourcePropType;
  export default content;
}

declare module "*.jpg" {
  import type { ImageSourcePropType } from "react-native";
  const content: ImageSourcePropType;
  export default content;
}

/**
 * Matches what react-native-svg-transformer emits: a component, not an asset.
 * Sizing and color are props — `currentColor` in the file maps to `color`.
 */
declare module "*.svg" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";
  const content: FC<SvgProps>;
  export default content;
}
