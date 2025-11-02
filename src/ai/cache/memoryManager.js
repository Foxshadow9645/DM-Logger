const memoryMap = new Map();

export function addToMemory(key, role, content) {
  if (!memoryMap.has(key)) memoryMap.set(key, []);
  const history = memoryMap.get(key);
  history.push({ role, content, timestamp: Date.now() });
  if (history.length > 10) history.shift();
}

export function getMemoryContext(key) {
  if (!memoryMap.has(key)) return "";
  return memoryMap
    .get(key)
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");
}

export function clearMemory(key) {
  memoryMap.delete(key);
}

