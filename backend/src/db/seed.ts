import { env } from "../config/env.js";
import { CategoryModel } from "../modules/category/model/category.model.js";
import { OccasionModel } from "../modules/occasion/model/occasion.model.js";
import { ProductModel } from "../modules/product/model/product.model.js";
import { UserModel } from "../modules/user/model/user.model.js";
import { BannerModel } from "../modules/banner/model/banner.model.js";
import { logger } from "../shared/utils/logger.js";

import { hashPassword } from "../modules/auth/utils/password.js";

export const seedInitialData = async (_force: boolean = false): Promise<void> => {
  try {
    // 1. Seed Admin & Customer Users
    const existingAdmin = await UserModel.findOne({
      $or: [
        { phone: "7897671632" },
        { phone: "9999999999" },
        { email: "ajaykterha@gmail.com" },
        { email: "ajayterha@gmail.com" },
        { email: "onebitebakery07@gmail.com" },
      ],
    });
    const isFirstRun = !existingAdmin;
    const defaultAdminHash = hashPassword("Admin@123");
    if (!existingAdmin) {
      await UserModel.create({
        name: "Ajay Prajapati",
        phone: "7897671632",
        email: "ajaykterha@gmail.com",
        role: "admin",
        password: defaultAdminHash,
        isVerified: true,
        status: "active",
        lastLogin: new Date(),
      });
      logger.info("Admin Ajay Prajapati seeded (phone: 7897671632)");
    } else {
      existingAdmin.name = "Ajay Prajapati";
      existingAdmin.phone = "7897671632";
      existingAdmin.email = "ajaykterha@gmail.com";
      existingAdmin.role = "admin";
      if (!existingAdmin.password) {
        existingAdmin.password = defaultAdminHash;
      }
      await existingAdmin.save();
    }

    const existingCustomer = await UserModel.findOne({ phone: "9876543210" });
    const defaultCustomerHash = hashPassword("Customer@123");
    if (!existingCustomer) {
      await UserModel.create({
        name: "Bakery Customer",
        phone: "9876543210",
        email: "customer@onebitebakery.local",
        role: "customer",
        password: defaultCustomerHash,
        isVerified: true,
        status: "active",
        lastLogin: new Date(),
      });
      logger.info("Bakery Customer seeded (phone: 9876543210)");
    } else if (!existingCustomer.password) {
      existingCustomer.password = defaultCustomerHash;
      await existingCustomer.save();
    }

    // 2. Seed & Clean Duplicate Categories
    const existingCats = await CategoryModel.find({ isDeleted: false }).exec();
    const seenSlugs = new Set<string>();
    for (const c of existingCats) {
      const slugKey = (c.slug || c.name).toLowerCase().trim();
      if (seenSlugs.has(slugKey)) {
        await CategoryModel.deleteOne({ _id: c._id });
        logger.info(`Removed duplicate category record '${c.name}' (${c._id}) from MongoDB`);
      } else {
        seenSlugs.add(slugKey);
      }
    }

    const categoryCount = await CategoryModel.countDocuments();
    let defaultCatId;
    if (categoryCount === 0) {
      const cat = await CategoryModel.create({
        name: "Artisanal Cakes",
        slug: "artisanal-cakes",
        description: "Freshly baked handcrafted celebration cakes using premium European chocolate & butter.",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
        seoTitle: "Artisanal Cakes - Fresh Bakery",
        seoDescription: "Order freshly baked artisanal cakes online",
        seoKeywords: ["cakes", "artisanal", "bakery"],
        searchableText: "artisanal cakes freshly baked handcrafted celebration cakes",
        displayOrder: 1,
        isActive: true,
        isDeleted: false,
      });
      defaultCatId = cat._id;

      await CategoryModel.insertMany([
        {
          name: "Pastries & Tarts",
          slug: "pastries-tarts",
          description: "Individual dessert pastries & fruit tarts",
          image: "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=600&q=80",
          seoTitle: "Pastries & Tarts - Onebite Bakery",
          seoDescription: "Fresh pastries and fruit tarts",
          seoKeywords: ["pastries", "tarts"],
          searchableText: "pastries tarts individual dessert",
          displayOrder: 2,
          isActive: true,
          isDeleted: false,
        },
        {
          name: "Fresh Breads",
          slug: "fresh-breads",
          description: "Artisan sourdough & whole wheat bakery breads",
          image: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80",
          seoTitle: "Fresh Breads - Onebite Bakery",
          seoDescription: "Artisan sourdough and fresh bakery breads",
          seoKeywords: ["breads", "sourdough"],
          searchableText: "fresh breads sourdough whole wheat",
          displayOrder: 3,
          isActive: true,
          isDeleted: false,
        },
        {
          name: "Cookies & Biscuits",
          slug: "cookies-biscuits",
          description: "Freshly baked butter cookies & biscotti",
          image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
          seoTitle: "Cookies & Biscuits - Onebite Bakery",
          seoDescription: "Freshly baked butter cookies and biscotti",
          seoKeywords: ["cookies", "biscuits"],
          searchableText: "cookies biscuits butter cookies biscotti",
          displayOrder: 4,
          isActive: true,
          isDeleted: false,
        },
        {
          name: "Combos & Hampers",
          slug: "combos-hampers",
          description: "Curated celebration hampers & combo boxes",
          image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
          seoTitle: "Combos & Hampers - Onebite Bakery",
          seoDescription: "Curated celebration hampers and combo boxes",
          seoKeywords: ["combos", "hampers", "gifts"],
          searchableText: "combos hampers celebration gift boxes",
          displayOrder: 5,
          isActive: true,
          isDeleted: false,
        },
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
          seoTitle: "Belgian Dark Chocolate Truffle Cake",
          seoDescription: "Order rich 70% Belgian dark chocolate ganache cake online",
          seoKeywords: ["cake", "chocolate", "truffle"],
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
          seoTitle: "Red Velvet Cream Cheese Pastry",
          seoDescription: "Classic red velvet sponge layered with smooth Philadelphia cream cheese",
          seoKeywords: ["pastry", "red velvet", "cream cheese"],
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
          seoTitle: "Fresh Sourdough Whole Wheat Bread",
          seoDescription: "Artisan sourdough bread baked fresh every morning with 100% organic whole wheat flour",
          seoKeywords: ["bread", "sourdough", "whole wheat"],
        },
      ]);
      logger.info("Default Bakery Products seeded into MongoDB");
    }

    // 4. Seed Branches and Villages
    const { VillageModel } = await import("../modules/village/model/village.model.js");
    const { BranchModel } = await import("../modules/branch/model/branch.model.js");
    const { BranchProductModel } = await import("../modules/branch/model/branch-product.model.js");

    const branchCount = await BranchModel.countDocuments();
    if (branchCount === 0) {
      const branches = await BranchModel.insertMany([
        {
          name: "Onebite Bakery Main Store",
          code: "TOB-HQ",
          type: "MAIN",
          address: {
            street: "Onebite Bakery, N 80°14, terha 25°49'43.3, 54.7\"E",
            city: "Hamirpur",
            state: "Uttar Pradesh",
            pincode: "210502",
          },
          phone: "7897671632",
          email: "ajaykterha@gmail.com",
          isActive: true,
        },
        {
          name: "Hamirpur Town Branch",
          code: "HMR-01",
          type: "FRANCHISE",
          address: { street: "Main Market Road", city: "Hamirpur", state: "Uttar Pradesh", pincode: "210502" },
          phone: "7897671632",
          email: "ajaykterha@gmail.com",
          isActive: true,
        },
      ]);
      const centralBranch = branches.find((b) => b.type === "MAIN" || b.code === "TOB-HQ") || branches[0];

      const villageCount = await VillageModel.countDocuments();
      if (villageCount === 0) {
        await VillageModel.insertMany([
          { name: "Terha", district: "Hamirpur", pincode: "210502", branchId: centralBranch?._id, isActive: true },
        ]);
        logger.info("Default Village Terha seeded and linked to Main Branch");
      }
    } else {
      const mainBranch =
        (await BranchModel.findOne({ type: "MAIN", isActive: true })) ||
        (await BranchModel.findOne({ code: "TOB-HQ" })) ||
        (await BranchModel.findOne({ name: /Main Store/i })) ||
        (await BranchModel.findOne({ isActive: true }));

      if (mainBranch) {
        if (mainBranch.type !== "MAIN") {
          mainBranch.type = "MAIN";
          mainBranch.isActive = true;
          await mainBranch.save();
        }

        // Find Raja / Franchise branch if created
        const rajaBranch = await BranchModel.findOne({
          $or: [{ name: /Raja/i }, { code: /RAJ/i }],
        });

        if (rajaBranch && rajaBranch.type !== "FRANCHISE") {
          rajaBranch.type = "FRANCHISE";
          await rajaBranch.save();
        }
      }
    }

    // 6. Seed Default Hero Banners / Posters
    const bannerCount = await BannerModel.countDocuments();
    if ((bannerCount === 0 && isFirstRun) || _force) {
      await BannerModel.insertMany([
        {
          title: "Handcrafted Delights for Every Celebration",
          subtitle: "Freshly Baked Every Morning",
          description: "From rich Belgian chocolate truffle cakes to party decoration accessories and custom tier cakes — made with love and 100% premium quality.",
          desktopImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
          mobileImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
          linkUrl: "/products",
          buttonText: "Explore All Products",
          badgeText: "Freshly Baked Daily",
          bgGradient: "from-[#FFF3E6] via-[#FFFBF5] to-[#F9F6F0]",
          displayOrder: 1,
          isActive: true,
          placement: "home_hero",
        },
        {
          title: "Belgian Chocolate Truffle & Gourmet Cakes",
          subtitle: "Best Seller Collection",
          description: "Indulge in our signature dark Belgian truffle layers, silky ganache, and melt-in-the-mouth cocoa sponge.",
          desktopImage: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=1200&q=80",
          mobileImage: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=600&q=80",
          linkUrl: "/categories/artisanal-cakes",
          buttonText: "Order Truffle Cakes",
          badgeText: "Flat 15% OFF",
          bgGradient: "from-[#FDF2E9] via-[#FAF0E6] to-[#F5ECE1]",
          displayOrder: 2,
          isActive: true,
          placement: "home_hero",
        },
        {
          title: "Custom 3D & Tier Designer Cakes Studio",
          subtitle: "Make Memories Sweeter",
          description: "Personalized dream cakes designed by master bakers for birthdays, anniversaries, weddings and milestones.",
          desktopImage: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=1200&q=80",
          mobileImage: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=600&q=80",
          linkUrl: "/custom-cake",
          buttonText: "Design Your Cake",
          badgeText: "Customized with Care",
          bgGradient: "from-[#FFF7ED] via-[#FFFBF0] to-[#FDF4E7]",
          displayOrder: 3,
          isActive: true,
          placement: "home_hero",
        },
        {
          title: "Celebration Party Shop & Combos",
          subtitle: "One-Stop Party Hub",
          description: "Complete party combos with designer candles, sparkling poppers, balloons, and delicious dessert hampers.",
          desktopImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
          mobileImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
          linkUrl: "/combos",
          buttonText: "View Party Combos",
          badgeText: "Fast 30-Min Delivery",
          bgGradient: "from-[#FEF3C7] via-[#FFFBEB] to-[#FEF9C3]",
          displayOrder: 4,
          isActive: true,
          placement: "home_hero",
        },
      ]);
      logger.info("Default Hero Banners / Posters seeded into MongoDB");
    }

    // 7. Seed Combos & Celebration Hampers
    const { ComboModel } = await import("../modules/combo/model/combo.model.js");
    const comboCount = await ComboModel.countDocuments();
    if ((comboCount === 0 && isFirstRun) || _force) {
      await ComboModel.insertMany([
        {
          title: "Deluxe Party Celebration Box",
          slug: "deluxe-party-celebration-box",
          description: "Signature 1kg Truffle Cake, Assorted French Macarons box (6 pcs), Fruit Tarts, and Party Popper.",
          items: ["1kg Belgian Dark Truffle Cake", "Box of 6 French Macarons", "2 Fresh Fruit Pastries", "Celebration Sparkler & Candles"],
          price: 1199,
          originalPrice: 1499,
          image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
          badge: "Bestseller Hamper",
          isActive: true,
          isAvailable: true,
          displayOrder: 1,
        },
        {
          title: "Sweet Morning Breakfast Hamper",
          slug: "sweet-morning-breakfast-hamper",
          description: "Fresh artisanal sourdough bread loaf, butter croissants, blueberry muffins, and handmade chocolate cookies.",
          items: ["1 Artisanal Sourdough Bread", "2 Butter Croissants", "2 Blueberry Muffins", "Box of Choco-Chip Cookies"],
          price: 549,
          originalPrice: 699,
          image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
          badge: "Morning Fresh",
          isActive: true,
          isAvailable: true,
          displayOrder: 2,
        },
      ]);
      logger.info("Default Celebration Combos seeded into MongoDB");
    }

    // 8. Seed Custom Cake Options (Flavors, Designs, Shapes)
    const { CustomCakeOptionModel } = await import("../modules/custom-cake/model/custom-cake-option.model.js");
    const customOptionCount = await CustomCakeOptionModel.countDocuments();
    if ((customOptionCount === 0 && isFirstRun) || _force) {
      await CustomCakeOptionModel.insertMany([
        {
          name: "Belgian Dark Chocolate Ganache",
          type: "FLAVOR",
          slug: "belgian-dark-chocolate",
          description: "Rich 70% pure Belgian cocoa ganache layered with moist sponge.",
          priceModifier: 750,
          category: "Chocolate Indulgence",
          imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
          colorCode: "#3E2723",
          isActive: true,
          displayOrder: 1,
        },
        {
          name: "Classic Red Velvet Cream Cheese",
          type: "FLAVOR",
          slug: "classic-red-velvet",
          description: "Crimson cocoa sponge infused with velvety Philadelphia cream cheese.",
          priceModifier: 650,
          category: "Signature Classics",
          imageUrl: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=400&q=80",
          colorCode: "#B71C1C",
          isActive: true,
          displayOrder: 2,
        },
        {
          name: "Royal Gold Drip & Macarons",
          type: "DESIGN",
          slug: "royal-gold-drip-macarons",
          description: "24k edible gold foil accents, chocolate drip, luxury French macarons & sprinkles.",
          priceModifier: 350,
          category: "Luxury Celebration",
          imageUrl: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=400&q=80",
          colorCode: "#D4AF37",
          isActive: true,
          displayOrder: 1,
        },
        {
          name: "Minimalist Korean Vintage Pastels",
          type: "DESIGN",
          slug: "minimalist-korean-vintage",
          description: "Smooth pastel cream frosting, vintage border piping, retro handwriting message plaque.",
          priceModifier: 200,
          category: "Trendy & Aesthetic",
          imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
          colorCode: "#F8BBD0",
          isActive: true,
          displayOrder: 2,
        },
      ]);
      logger.info("Default Custom Cake Studio Options seeded into MongoDB");
    }

    // 9. Seed Initial Verified Reviews
    const { ReviewModel } = await import("../modules/review/model/review.model.js");
    const reviewCount = await ReviewModel.countDocuments();
    if ((reviewCount === 0 && isFirstRun) || _force) {
      await ReviewModel.insertMany([
        {
          customerName: "Ananya Sharma",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          rating: 5,
          qualityRating: 5,
          tasteRating: 5,
          comment: "The Belgian Dark Chocolate Truffle was unbelievable! Perfectly moist and rich. Ordered for my mom's birthday.",
          productName: "Belgian Dark Chocolate Truffle Cake",
          isVerified: true,
          isActive: true,
        },
        {
          customerName: "Rohan Verma",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          rating: 5,
          qualityRating: 5,
          tasteRating: 5,
          comment: "Best eggless bakery in town. Delivery was super fast and the sourdough bread was hot & fresh!",
          productName: "Fresh Sourdough Bread",
          isVerified: true,
          isActive: true,
        },
        {
          customerName: "Priya Patel",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
          rating: 5,
          qualityRating: 5,
          tasteRating: 5,
          comment: "Ordered the custom tier cake for our anniversary. Design was exact to the picture and flavor was heavenly!",
          productName: "Custom Tier Cake",
          isVerified: true,
          isActive: true,
        },
      ]);
      logger.info("Default Verified Customer Reviews seeded into MongoDB");
    }
  } catch (error) {
    logger.warn({ error }, "Skipping dev database seed due to error");
  }
};

export const seedDevelopmentData = seedInitialData;

