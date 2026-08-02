import { env } from "../config/env.js";
import { CategoryModel } from "../modules/category/model/category.model.js";
import { OccasionModel } from "../modules/occasion/model/occasion.model.js";
import { ProductModel } from "../modules/product/model/product.model.js";
import { UserModel } from "../modules/user/model/user.model.js";
import { logger } from "../shared/utils/logger.js";

export const seedDevelopmentData = async (): Promise<void> => {
  try {
    // 1. Seed Admin & Customer Users
    const existingAdmin = await UserModel.findOne({ phone: "9999999999" });
    if (!existingAdmin) {
      await UserModel.create({
        name: "Development Admin",
        phone: "9999999999",
        email: "admin@onebite.local",
        role: "admin",
        isVerified: true,
        status: "active",
        lastLogin: new Date(),
      });
      logger.info("Development Admin seeded (phone: 9999999999)");
    }

    const existingCustomer = await UserModel.findOne({ phone: "9876543210" });
    if (!existingCustomer) {
      await UserModel.create({
        name: "Bakery Customer",
        phone: "9876543210",
        email: "customer@onebite.local",
        role: "customer",
        isVerified: true,
        status: "active",
        lastLogin: new Date(),
      });
      logger.info("Bakery Customer seeded (phone: 9876543210)");
    }

    // 2. Seed Categories
    const categoryCount = await CategoryModel.countDocuments();
    let defaultCatId;
    if (categoryCount === 0) {
      const cat = await CategoryModel.create({
        name: "Artisanal Cakes",
        slug: "artisanal-cakes",
        description: "Freshly baked handcrafted celebration cakes using premium European chocolate & butter.",
        displayOrder: 1,
        isActive: true,
        isDeleted: false,
      });
      defaultCatId = cat._id;

      await CategoryModel.insertMany([
        { name: "Pastries & Tarts", slug: "pastries-tarts", description: "Individual dessert pastries & fruit tarts", displayOrder: 2, isActive: true, isDeleted: false },
        { name: "Fresh Breads", slug: "fresh-breads", description: "Artisan sourdough & whole wheat bakery breads", displayOrder: 3, isActive: true, isDeleted: false },
        { name: "Cookies & Biscuits", slug: "cookies-biscuits", description: "Freshly baked butter cookies & biscotti", displayOrder: 4, isActive: true, isDeleted: false },
        { name: "Combos & Hampers", slug: "combos-hampers", description: "Curated celebration hampers & combo boxes", displayOrder: 5, isActive: true, isDeleted: false },
      ]);
      logger.info("Default Bakery Categories seeded into MongoDB");
    } else {
      const firstCat = await CategoryModel.findOne().select("_id").lean();
      defaultCatId = firstCat?._id;
    }

    // 3. Seed Products
    const productCount = await ProductModel.countDocuments();
    if (productCount === 0 && defaultCatId) {
      await ProductModel.insertMany([
        {
          name: "Belgian Dark Chocolate Truffle Cake",
          slug: "belgian-dark-chocolate-truffle-cake",
          shortDescription: "Rich 70% Belgian dark chocolate ganache cake",
          description: "Our signature Belgian Truffle cake crafted with 70% cocoa dark chocolate, Dutch cocoa sponge, and smooth ganache frosting.",
          categoryId: defaultCatId,
          productType: "NORMAL",
          price: 649,
          compareAtPrice: 799,
          costPrice: 350,
          sku: "CAKE-TRUFFLE-01",
          isEggless: true,
          isAvailable: true,
          isActive: true,
          isFeatured: true,
          isTrending: true,
          isRecommended: true,
          imageUrls: ["https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"],
          thumbnailUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
          stockStatus: "IN_STOCK",
        },
        {
          name: "Red Velvet Cream Cheese Pastry",
          slug: "red-velvet-cream-cheese-pastry",
          shortDescription: "Velvety cocoa sponge with Philadelphia cream cheese",
          description: "Classic red velvet sponge layered with smooth Philadelphia cream cheese frosting and white chocolate curls.",
          categoryId: defaultCatId,
          productType: "NORMAL",
          price: 169,
          compareAtPrice: 199,
          sku: "PASTRY-REDVELVET-02",
          isEggless: true,
          isAvailable: true,
          isActive: true,
          isFeatured: true,
          isTrending: true,
          imageUrls: ["https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=600&q=80"],
          thumbnailUrl: "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=600&q=80",
          stockStatus: "IN_STOCK",
        },
        {
          name: "Fresh Sourdough Whole Wheat Bread",
          slug: "fresh-sourdough-whole-wheat-bread",
          shortDescription: "36-hour naturally fermented sourdough loaf",
          description: "Artisan sourdough bread baked fresh every morning with 100% organic whole wheat flour and wild yeast culture.",
          categoryId: defaultCatId,
          productType: "NORMAL",
          price: 140,
          compareAtPrice: 160,
          sku: "BREAD-SOURDOUGH-03",
          isEggless: true,
          isAvailable: true,
          isActive: true,
          isFeatured: false,
          isTrending: true,
          imageUrls: ["https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80"],
          thumbnailUrl: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80",
          stockStatus: "IN_STOCK",
        },
      ]);
      logger.info("Default Bakery Products seeded into MongoDB");
    }
  } catch (error) {
    logger.warn({ error }, "Skipping dev database seed due to error");
  }
};
