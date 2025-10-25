export class Product {
  constructor(
    public id: number,
    public sku: string,
    public name: string,
    public price_cents: number,
    public stock: number
  ) {}

  get formattedPrice(): string {
    return `₡${(this.price_cents / 100).toFixed(2)}`;
  }

  updateStock(delta: number) {
    this.stock += delta;
  }
}
