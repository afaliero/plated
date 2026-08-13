import logo from "./logo.png";

export const images = {
  logo,
} as const;

export type ImageName = keyof typeof images;
