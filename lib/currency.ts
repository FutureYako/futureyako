export function formatTsh(amount: number | string | null | undefined, options?: { decimals?: number }) {
  const decimals = options?.decimals ?? 2;
  const num = parseFloat(String(amount ?? 0)) || 0;
  return `TSh ${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
