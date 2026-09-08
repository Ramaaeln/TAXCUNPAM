import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"]) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
