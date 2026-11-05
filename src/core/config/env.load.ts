// Side-effect module: import it first in the entry point so the environment is
// loaded and validated before any module that reads process.env at import time.
import { loadEnv } from "./env";

loadEnv();
