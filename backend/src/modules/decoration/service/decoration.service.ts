import { type Decoration } from "../model/decoration.model.js";
import { decorationRepository } from "../repository/decoration.repository.js";

export const BASELINE_DECORATIONS: Partial<Decoration>[] = [
  {
    name: "Golden Metallic Happy Birthday Candle Set",
    slug: "golden-metallic-happy-birthday-candle-set",
    category: "Candles & Toppers",
    price: 149,
    originalPrice: 199,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    description: "Premium food-safe metallic gold candles for milestone birthday cakes.",
    inStock: true,
    isActive: true,
    displayOrder: 1,
  },
  {
    name: "Pastel Balloon Arch Decoration Set (50 Pcs)",
    slug: "pastel-balloon-arch-decoration-set-50-pcs",
    category: "Party Balloons",
    price: 399,
    originalPrice: 499,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    description: "Macaron pastel shade balloon arch kit with ribbon and glue dots.",
    inStock: true,
    isActive: true,
    displayOrder: 2,
  },
  {
    name: "Acrylic Custom Name Cake Topper",
    slug: "acrylic-custom-name-cake-topper",
    category: "Cake Toppers",
    price: 249,
    originalPrice: 299,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    description: "Reusable mirrored gold acrylic topper customized for your celebration.",
    inStock: true,
    isActive: true,
    displayOrder: 3,
  },
  {
    name: "Confetti Party Popper Streamer Pack",
    slug: "confetti-party-popper-streamer-pack",
    category: "Party Accessories",
    price: 199,
    originalPrice: 249,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    description: "Biodegradable paper confetti cannons for cake cutting moments.",
    inStock: true,
    isActive: true,
    displayOrder: 4,
  },
];

export interface CreateDecorationInput {
  name: string;
  slug?: string;
  category: string;
  price: number;
  originalPrice: number;
  rating?: number;
  image: string;
  images?: string[];
  description: string;
  inStock?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

export class DecorationService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // Returns live active decorations from database without fallback seeding
  async getActiveDecorations(category?: string): Promise<Decoration[]> {
    return decorationRepository.findActive(category);
  }

  async getAllDecorationsAdmin(params?: {
    search?: string;
    category?: string;
    status?: string;
  }): Promise<Decoration[]> {
    return decorationRepository.findAllAdmin(params);
  }

  async getDecorationById(id: string): Promise<Decoration | null> {
    return decorationRepository.findById(id);
  }

  async createDecoration(input: CreateDecorationInput): Promise<Decoration> {
    const slug = input.slug?.trim() || `${this.generateSlug(input.name)}-${Date.now().toString(36)}`;
    return decorationRepository.create({
      ...input,
      slug,
      rating: input.rating !== undefined ? Number(input.rating) : 4.8,
      inStock: input.inStock !== undefined ? Boolean(input.inStock) : true,
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
      displayOrder: input.displayOrder !== undefined ? Number(input.displayOrder) : 0,
    });
  }

  async updateDecoration(id: string, input: Partial<CreateDecorationInput>): Promise<Decoration | null> {
    const updateData: Partial<Decoration> = { ...input };
    if (input.name && !input.slug) {
      updateData.slug = `${this.generateSlug(input.name)}-${Date.now().toString(36)}`;
    }
    return decorationRepository.update(id, updateData);
  }

  async toggleDecorationStatus(id: string): Promise<Decoration | null> {
    const current = await decorationRepository.findById(id);
    if (!current) return null;
    return decorationRepository.update(id, { isActive: !current.isActive });
  }

  async toggleDecorationStock(id: string): Promise<Decoration | null> {
    const current = await decorationRepository.findById(id);
    if (!current) return null;
    return decorationRepository.update(id, { inStock: !current.inStock });
  }

  async deleteDecoration(id: string): Promise<boolean> {
    return decorationRepository.delete(id);
  }

  // Seed baseline decorations ONCE only when specifically requested (e.g. system seed)
  async seedBaselineIfEmpty(): Promise<number> {
    const count = await decorationRepository.count();
    if (count > 0) return 0;

    for (const item of BASELINE_DECORATIONS) {
      await decorationRepository.create(item);
    }
    return BASELINE_DECORATIONS.length;
  }
}

export const decorationService = new DecorationService();
