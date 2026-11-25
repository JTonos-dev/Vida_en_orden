/** The record may be absent or outside the caller's scope; do not distinguish them. */
export class DomainReferenceError extends Error {
  constructor(message = "Referencia no encontrada o sin acceso") {
    super(message);
    this.name = "DomainReferenceError";
  }
}
