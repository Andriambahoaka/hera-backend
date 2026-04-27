
export class AppError extends Error {
  public status: number;

  constructor(error: {status: number; message: string }) {
    super(error.message);
    this.status = error.status;
  }
}