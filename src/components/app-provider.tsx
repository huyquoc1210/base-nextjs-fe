"use client"; // useEffect, useRef and a zustand store reading localStorage

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RefreshToken from "@/components/refresh-token";
import { useEffect, useRef } from "react";
import { decodeToken } from "@/lib/jwt";
import LocalStorage from "@/lib/local-storage";
import type { RoleType } from "@/types/jwt";
import type { FCC } from "@/types/react";
import { create } from "zustand";

// Keep the React Query defaults (staleTime 0, gc 5 min) and only stop
// refetching on window focus, which otherwise fires on every tab switch
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

type AppStore = {
  isAuth: boolean;
  role: RoleType | undefined;
  setRole: (role?: RoleType | undefined) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  isAuth: false,
  role: undefined,
  setRole: (role?: RoleType | undefined) => {
    set({ role, isAuth: Boolean(role) });

    if (!role) {
      LocalStorage.remove("accessToken");
      LocalStorage.remove("refreshToken");
    }
  },
}));

const AppProvider: FCC = (props) => {
  const { children } = props;

  // #region State
  const setRole = useAppStore((state) => state.setRole);

  // Strict Mode mounts twice in dev, guard against a second run
  const hasInitialized = useRef(false);
  // #endregion

  // #region Effects
  useEffect(() => {
    if (!hasInitialized.current) {
      const accessToken = LocalStorage.get<string>("accessToken");

      if (accessToken) {
        const role = decodeToken(accessToken).role;
        setRole(role);
      }

      hasInitialized.current = true;
    }
  }, [setRole]);
  // #endregion

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <RefreshToken />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default AppProvider;
