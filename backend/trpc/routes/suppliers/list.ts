import { publicProcedure } from "../../create-context";
import { z } from "zod";

export type Supplier = {
  id: string;
  name: string;
  category: "Produce" | "Meat & Poultry" | "Seafood" | "Dairy" | "Dry Goods" | "Beverages" | "Bakery" | "Spices" | "Packaging";
  rating: number;
  minOrder: string;
  fulfillmentTime: string;
  image: string;
  tags: string[];
  phone?: string;
  website?: string;
  location?: string;
};

export const listSuppliersProcedure = publicProcedure
  .input(
    z
      .object({
        search: z.string().optional(),
        category: z
          .enum([
            "Produce",
            "Meat & Poultry",
            "Seafood",
            "Dairy",
            "Dry Goods",
            "Beverages",
            "Bakery",
            "Spices",
            "Packaging",
          ])
          .optional(),
      })
      .optional()
  )
  .query(async ({ input }) => {
    const q = input?.search?.toLowerCase() ?? "";
    const cat = input?.category;

    try {
      const res = await fetch("https://dummyjson.com/users?limit=50");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const data = (await res.json()) as any;
      const users = (data.users ?? []) as any[];

      let suppliers = users.map((u) => {
        const id = String(u.id);
        const name = `${String(u.firstName)} ${String(u.lastName)}`.trim();
        const categoryPool: Supplier["category"][] = [
          "Produce",
          "Meat & Poultry",
          "Seafood",
          "Dairy",
          "Dry Goods",
          "Beverages",
          "Bakery",
          "Spices",
          "Packaging",
        ];
        const category = categoryPool[u.id % categoryPool.length];
        const rating = 3 + (u.id % 3) + 0.1 * (u.age % 10);
        const minOrder = `${50 + (u.id % 200)}`;
        const fulfillmentTime = ["Same-day", "24-48h", "2-3 days", "3-5 days"][u.id % 4] ?? "2-3 days";
        const image = String(u.image ?? `https://i.pravatar.cc/300?img=${u.id}`);
        const tags = [u.company?.department, u.company?.title].filter(Boolean).map(String) as string[];
        const phone = String(u.phone ?? "");
        const website = u.domain ? `https://${String(u.domain)}` : undefined;
        const location = `${u.address?.city ?? ""}`.trim() || undefined;
        return { id, name, category, rating, minOrder, fulfillmentTime, image, tags, phone, website, location } satisfies Supplier;
      });

      if (q.length > 0) {
        suppliers = suppliers.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.tags.join(" ").toLowerCase().includes(q) ||
            (s.location?.toLowerCase().includes(q) ?? false)
        );
      }

      if (cat) {
        suppliers = suppliers.filter((s) => s.category === cat);
      }

      return suppliers;
    } catch (e) {
      return [] as Supplier[];
    }
  });
