export const parseMoneyToCents = (s: string) => {
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Math.round((isNaN(n) ? 0 : n) * 100);
};
