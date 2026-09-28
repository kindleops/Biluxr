"use client";

import { useState } from "react";

/**
 * Runs `onResult` once each time a server action returns a new state, during
 * render (React's "adjust state when a value changes" pattern) rather than in
 * an effect. `onResult` may only update this component's own state.
 */
export function useActionResult<S>(state: S, onResult: (state: S) => void): void {
  const [previous, setPrevious] = useState(state);
  if (previous !== state) {
    setPrevious(state);
    onResult(state);
  }
}
