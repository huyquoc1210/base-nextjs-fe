import { defaultLocale } from "@/config";
import messages from "../../messages/en.json";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

// Renders with the real English catalog rather than a stub, so a missing or
// renamed key fails the test instead of silently showing the key itself.
const Wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale={defaultLocale} messages={messages}>
    {children}
  </NextIntlClientProvider>
);

export const renderWithIntl = (ui: ReactElement) =>
  render(ui, { wrapper: Wrapper });
