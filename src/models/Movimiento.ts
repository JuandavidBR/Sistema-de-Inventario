export class Movimiento {
  constructor(
    public id: number,
    public tipo: "IN" | "OUT",
    public cantidad: number,
    public observacion: string | null,
    public fecha: string,
    public usuario_email: string | null,
    public products?: { name: string }
  ) {}
}
