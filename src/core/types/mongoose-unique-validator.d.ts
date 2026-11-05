// Local typing: replaces @types/mongoose-unique-validator, which pulled in a
// second, outdated copy of mongoose (v6) and its MongoDB driver.
declare module "mongoose-unique-validator" {
  import type { Schema } from "mongoose";
  const uniqueValidator: (schema: Schema, options?: Record<string, unknown>) => void;
  export default uniqueValidator;
}
