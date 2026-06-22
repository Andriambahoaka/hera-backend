
export class AppError extends Error {
  public code : string;
  public status: number;

  constructor(error: {code: string; status: number; message: string }) {
    super(error.message);
    this.code = error.code;
    this.status = error.status;
    console.log(error.message);
  }
}