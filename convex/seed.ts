import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, { storageId }) => {
        const imageId = await ctx.db.insert("images", {
            storageId,
        });
        return imageId;
    },
});
