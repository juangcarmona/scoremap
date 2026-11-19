import { useLayoutEffect, useRef } from "react";

// Work begun in one edit session must not resume after leaving that session.
export function useEditAdmission(editable: boolean) {
  const state = useRef({ editable: false, epoch: 0 });
  useLayoutEffect(() => {
    const current = state.current;
    current.editable = editable;
    current.epoch++;
    return () => {
      current.editable = false;
      current.epoch++;
    };
  }, [editable]);
  return () => {
    const epoch = state.current.epoch;
    return () => {
      if (!state.current.editable || state.current.epoch !== epoch)
        throw new Error(
          "Switch to Edit and restart this operation. Existing data and the source file are kept.",
        );
    };
  };
}
