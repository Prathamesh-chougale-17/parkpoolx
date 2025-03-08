"use client";

import { useState, useCallback, useTransition } from "react";

type ActionFunction<TState> = (
  state: TState,
  formData: FormData
) => Promise<TState>;

/**
 * Custom hook for handling state with Next.js Server Actions
 *
 * @param action The server action function
 * @param initialState The initial state object
 * @returns [state, boundAction, isPending] tuple
 */
export function useActionState<TState>(
  action: ActionFunction<TState>,
  initialState: TState
): [TState, (formData: FormData) => void, boolean] {
  const [state, setState] = useState<TState>(initialState);
  const [isPending, startTransition] = useTransition();

  const boundAction = useCallback(
    (formData: FormData) => {
      startTransition(async () => {
        const result = await action(state, formData);
        setState(result);
      });
    },
    [action, state]
  );

  return [state, boundAction, isPending];
}
