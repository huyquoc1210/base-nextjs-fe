"use client"; // next-themes reads localStorage and prefers-color-scheme

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof NextThemesProvider>;

const ThemeProvider = (props: Props) => {
  const { children, ...themeProps } = props;

  return <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>;
};

export default ThemeProvider;
