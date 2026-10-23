import type {
  Dispatch,
  FunctionComponent,
  PropsWithChildren,
  SetStateAction,
} from "react";

export type FCC<T = object> = FunctionComponent<PropsWithChildren<T>>;
export type DispatchAction<T> = Dispatch<SetStateAction<T>>;
