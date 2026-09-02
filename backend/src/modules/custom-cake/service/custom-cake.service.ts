import type { HydratedDocument } from "mongoose";

import { CustomCakeRepository } from "../repository/custom-cake.repository.js";
import type {
  CustomCakeOption,
  CustomCakeOptionType,
} from "../model/custom-cake-option.model.js";
import type {
  CustomCakeInquiry,
  CustomCakeInquiryStatus,
} from "../model/custom-cake-inquiry.model.js";

const DEFAULT_OPTIONS: Partial<CustomCakeOption>[] = [
  // Flavors
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
    name: "Fresh Blueberry Cheesecake Swirl",
    type: "FLAVOR",
    slug: "fresh-blueberry-cheesecake",
    description: "Graham crust base, creamy NY cheesecake with wild blueberry compote.",
    priceModifier: 750,
    category: "Fruit & Exotic",
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80",
    colorCode: "#4A148C",
    isActive: true,
    displayOrder: 3,
  },
  {
    name: "Madagascar Vanilla Bean & Berries",
    type: "FLAVOR",
    slug: "madagascar-vanilla-berries",
    description: "Real bourbon vanilla sponge layered with strawberry & raspberry crush.",
    priceModifier: 600,
    category: "Signature Classics",
    imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80",
    colorCode: "#FFF8E1",
    isActive: true,
    displayOrder: 4,
  },
  {
    name: "Pistachio Raspberry Royale",
    type: "FLAVOR",
    slug: "pistachio-raspberry-royale",
    description: "Roasted Iranian pistachio mousse coupled with tart raspberry coulis.",
    priceModifier: 850,
    category: "Luxury Nuts",
    imageUrl: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=400&q=80",
    colorCode: "#558B2F",
    isActive: true,
    displayOrder: 5,
  },
  {
    name: "Butterscotch Caramel Crunch",
    type: "FLAVOR",
    slug: "butterscotch-caramel-crunch",
    description: "Golden praline butterscotch crunch with warm salted caramel layers.",
    priceModifier: 600,
    category: "Signature Classics",
    imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80",
    colorCode: "#FF8F00",
    isActive: true,
    displayOrder: 6,
  },
  {
    name: "Ferrero Rocher & Hazelnut Praline",
    type: "FLAVOR",
    slug: "ferrero-rocher-hazelnut",
    description: "Nutella ganache, toasted Italian hazelnuts & wafer crunch pearls.",
    priceModifier: 850,
    category: "Chocolate Indulgence",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80",
    colorCode: "#4E342E",
    isActive: true,
    displayOrder: 7,
  },
  {
    name: "Fresh Fruit Cocktail Supreme",
    type: "FLAVOR",
    slug: "fresh-fruit-cocktail-supreme",
    description: "Light chiffon sponge loaded with kiwi, seasonal berries, mango and pineapple.",
    priceModifier: 650,
    category: "Fruit & Exotic",
    imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=400&q=80",
    colorCode: "#E65100",
    isActive: true,
    displayOrder: 8,
  },

  // Design Themes
  {
    name: "Royal Gold Drip & Macarons",
    type: "DESIGN",
    slug: "royal-gold-drip-macarons",
    description: "24k edible gold foil accents, chocolate drip, luxury French macarons & sprinkles.",
    priceModifier: 350,
    category: "Luxury Celebration",
    imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80",
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
  {
    name: "Enchanted Floral Meadow",
    type: "DESIGN",
    slug: "enchanted-floral-meadow",
    description: "Organic edible flowers, rosemary sprigs, buttercream floral cascade & pearls.",
    priceModifier: 400,
    category: "Weddings & Anniversaries",
    imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80",
    colorCode: "#E8F5E9",
    isActive: true,
    displayOrder: 3,
  },
  {
    name: "Kids Magical Fantasy & Cartoon",
    type: "DESIGN",
    slug: "kids-magical-fantasy",
    description: "Vibrant colors, customized fondant 2D/3D cutouts, rainbow sprinkles & chocolate gems.",
    priceModifier: 300,
    category: "Kids & Fun",
    imageUrl: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=400&q=80",
    colorCode: "#80DEEA",
    isActive: true,
    displayOrder: 4,
  },
  {
    name: "Rustic Semi-Naked Botanical",
    type: "DESIGN",
    slug: "rustic-semi-naked",
    description: "Exposed rustic sponge edges, light vanilla crumb coat, fresh eucalyptus & figs.",
    priceModifier: 150,
    category: "Weddings & Anniversaries",
    imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=400&q=80",
    colorCode: "#D7CCC8",
    isActive: true,
    displayOrder: 5,
  },
  {
    name: "Custom Edible Photo / Plaque Print",
    type: "DESIGN",
    slug: "custom-edible-photo-print",
    description: "High-definition food-safe sugar sheet printing with ornate buttercream framing.",
    priceModifier: 250,
    category: "Personalized",
    imageUrl: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=400&q=80",
    colorCode: "#ECEFF1",
    isActive: true,
    displayOrder: 6,
  },

  // Shapes
  {
    name: "Classic Round",
    type: "SHAPE",
    slug: "classic-round",
    description: "Timeless cylindrical cake with clean modern edges.",
    priceModifier: 0,
    category: "Classic",
    colorCode: "#2C1E16",
    isActive: true,
    displayOrder: 1,
  },
  {
    name: "Sweet Heart Shape",
    type: "SHAPE",
    slug: "sweet-heart-shape",
    description: "Romantic heart contour perfect for anniversaries & Valentine celebrations.",
    priceModifier: 100,
    category: "Romantic",
    colorCode: "#E91E63",
    isActive: true,
    displayOrder: 2,
  },
  {
    name: "Modern Square / Cube",
    type: "SHAPE",
    slug: "modern-square",
    description: "Sharp contemporary square geometry with bold aesthetics.",
    priceModifier: 50,
    category: "Contemporary",
    colorCode: "#37474F",
    isActive: true,
    displayOrder: 3,
  },
];

export class CustomCakeService {
  constructor(private readonly repo: CustomCakeRepository) {}

  public async getOptions(type?: CustomCakeOptionType, onlyActive = true): Promise<CustomCakeOption[]> {
    const count = await this.repo.countOptions();
    if (count === 0) {
      for (const opt of DEFAULT_OPTIONS) {
        await this.repo.createOption(opt);
      }
    }
    return this.repo.findAllOptions(type, onlyActive);
  }

  public async createOption(data: Partial<CustomCakeOption>): Promise<HydratedDocument<CustomCakeOption>> {
    if (!data.slug) {
      data.slug = data.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `opt-${Date.now()}`;
    }
    return this.repo.createOption(data);
  }

  public async updateOption(id: string, data: Partial<CustomCakeOption>): Promise<HydratedDocument<CustomCakeOption> | null> {
    return this.repo.updateOption(id, data);
  }

  public async deleteOption(id: string): Promise<boolean> {
    return this.repo.deleteOption(id);
  }

  // Inquiries
  public async createInquiry(data: Partial<CustomCakeInquiry>): Promise<HydratedDocument<CustomCakeInquiry>> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const inquiryNumber = `CC-${new Date().getFullYear()}-${randomSuffix}`;
    data.inquiryNumber = inquiryNumber;
    data.status = "PENDING";

    return this.repo.createInquiry(data);
  }

  public async getInquiries(filters: {
    status?: CustomCakeInquiryStatus;
    search?: string;
    userId?: string;
  } = {}): Promise<HydratedDocument<CustomCakeInquiry>[]> {
    return this.repo.findAllInquiries(filters);
  }

  public async getInquiryById(id: string): Promise<HydratedDocument<CustomCakeInquiry> | null> {
    return this.repo.findInquiryById(id);
  }

  public async getInquiryByNumber(number: string): Promise<HydratedDocument<CustomCakeInquiry> | null> {
    return this.repo.findInquiryByNumber(number);
  }

  public async updateInquiry(
    id: string,
    data: {
      status?: CustomCakeInquiryStatus;
      adminNotes?: string;
      adminRecommendation?: {
        recommendedProductId?: string;
        recommendedCakeTitle?: string;
        quotedPrice?: number;
        message?: string;
      };
    },
  ): Promise<HydratedDocument<CustomCakeInquiry> | null> {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
    if (data.adminRecommendation) {
      updateData.adminRecommendation = {
        ...data.adminRecommendation,
        recommendedAt: new Date(),
      };
    }
    return this.repo.updateInquiry(id, updateData);
  }

  public async deleteInquiry(id: string): Promise<boolean> {
    return this.repo.deleteInquiry(id);
  }
}
