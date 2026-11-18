import { createContext, useContext } from "react";
import { defaultNotation, type Notation } from "./notation";

export type NotationState = {
  preference: Notation;
  choose: (preference: Notation) => void;
  pending: boolean;
  loading: boolean;
  error: string;
  scope: "device" | "account";
  retry: () => void;
  reload: () => void;
};
export const NotationContext = createContext<NotationState>({
  preference: defaultNotation,
  choose: () => undefined,
  pending: false,
  loading: false,
  error: "",
  scope: "device",
  retry: () => undefined,
  reload: () => undefined,
});
export const useNotation = () => useContext(NotationContext);
