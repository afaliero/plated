import { useEffect, useRef, useState } from "react";
import type { FridgeItem } from "@plated/shared";
import { addFridgeItem, getFridge, removeFridgeItem } from "src/api/client";

export function useFridge() {
  const [items, setItems] = useState<FridgeItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mutationPending = useRef(false);

  useEffect(() => {
    let active = true;
    getFridge()
      .then((result) => {
        if (active) setItems(result);
      })
      .catch((e: unknown) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load your fridge.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setError(null);
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  async function mutate(
    request: () => Promise<FridgeItem[]>,
  ): Promise<boolean> {
    if (loading || items === null || mutationPending.current) return false;
    mutationPending.current = true;
    setSaving(true);
    setError(null);
    try {
      setItems(await request());
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save your fridge. Try again.",
      );
      return false;
    } finally {
      mutationPending.current = false;
      setSaving(false);
    }
  }

  return {
    items,
    error,
    loading,
    saving,
    retry,
    add: (name: string) => mutate(() => addFridgeItem(name)),
    remove: (id: number) => mutate(() => removeFridgeItem(id)),
  };
}
