import "express";

declare module "express" {
  export interface Request {
    auth?: {
      userId: string;
    };
  }
}