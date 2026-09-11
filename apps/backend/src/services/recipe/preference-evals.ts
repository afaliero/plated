export function candidateIntegrity(
  selectedIds: readonly string[],
  candidateIds: ReadonlySet<string>,
): number {
  return selectedIds.every((id) => candidateIds.has(id)) ? 1 : 0;
}

export function topKRecall(
  selectedIds: readonly string[],
  expectedIds: ReadonlySet<string>,
  k = 3,
): number {
  const denominator = Math.min(k, expectedIds.size);
  if (denominator === 0) return 1;
  return (
    selectedIds.slice(0, k).filter((id) => expectedIds.has(id)).length /
    denominator
  );
}

export function noPreferenceAiCalls(
  preferenceValues: readonly (string | undefined)[],
): number {
  return preferenceValues.filter((value) => Boolean(value?.trim())).length === 0
    ? 1
    : 0;
}
