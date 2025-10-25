/** Valida que el SKU use solo mayúsculas, números y guiones */
export function validateSKU(sku: string): boolean {
  return /^[A-Z0-9\-]{3,}$/.test(sku);
}
