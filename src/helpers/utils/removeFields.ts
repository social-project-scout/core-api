// Exclude keys from entity
export function removeFields<T, Key extends keyof T>(
  entity: T,
  keys: Key[],
): Omit<T, Key> {
  for (const key of keys) {
    delete entity[key];
  }
  return entity;
}
