export function getNextSequentialCode(codes: string[], prefix: string) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix}-(\\d+)$`);
  const lastNumber = codes.reduce((max, code) => {
    const match = pattern.exec(code);

    if (!match) {
      return max;
    }

    return Math.max(max, Number(match[1]));
  }, 0);

  return `${prefix}-${String(lastNumber + 1).padStart(3, "0")}`;
}
