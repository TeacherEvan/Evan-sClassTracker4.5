import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function main() {
    console.log("Seeding database...");
    await client.mutation("seed:seedDatabase", { clearExisting: true });
    console.log("Seeding complete!");
}

main().catch(console.error);
