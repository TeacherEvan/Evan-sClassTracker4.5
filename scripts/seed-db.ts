import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
import { api } from "../convex/_generated/api";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function main() {
  console.log("Seeding database...");
  await client.mutation(api.seed.seedDatabase, { clearExisting: true });
  console.log("Seeding complete!");
}

main().catch(console.error);
