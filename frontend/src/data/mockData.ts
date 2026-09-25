export interface MockProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  category: string;
  isEggless: boolean;
  isBestseller?: boolean;
  description: string;
}

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount: number;
}

export interface MockOccasion {
  id: string;
  name: string;
  slug: string;
  image: string;
  tagline: string;
}

export interface MockCombo {
  id: string;
  title: string;
  items: string[];
  price: number;
  originalPrice: number;
  image: string;
}

export interface MockReview {
  id: string;
  name: string;
  customerName?: string;
  userEmail?: string;
  userId?: string;
  rating: number;
  qualityRating?: number;
  tasteRating?: number;
  comment: string;
  productName?: string;
  productId?: string;
  orderId?: string;
  tags?: string[];
  isVerified?: boolean;
  isActive?: boolean;
  date?: string;
  createdAt?: string;
  avatar: string;
}

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: "cat-1",
    name: "Artisanal Cakes",
    slug: "artisanal-cakes",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
    itemCount: 24,
  },
  {
    id: "cat-2",
    name: "Pastries & Tarts",
    slug: "pastries-tarts",
    image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=600&q=80",
    itemCount: 18,
  },
  {
    id: "cat-3",
    name: "Fresh Breads",
    slug: "fresh-breads",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    itemCount: 12,
  },
  {
    id: "cat-4",
    name: "Cookies & Biscuits",
    slug: "cookies-biscuits",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
    itemCount: 15,
  },
];

export const MOCK_OCCASIONS: MockOccasion[] = [
  {
    id: "occ-1",
    name: "Birthdays",
    slug: "birthdays",
    image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=600&q=80",
    tagline: "Celebrate special milestones with custom tiered cakes.",
  },
  {
    id: "occ-2",
    name: "Anniversaries",
    slug: "anniversaries",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80",
    tagline: "Romantic red velvet and Belgian chocolate treats.",
  },
  {
    id: "occ-3",
    name: "Weddings",
    slug: "weddings",
    image: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80",
    tagline: "Elegant multi-tier custom centerpiece creations.",
  },
  {
    id: "occ-4",
    name: "Festivals & Parties",
    slug: "festivals",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    tagline: "Assorted party hampers and dessert platters.",
  },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "prod-1",
    name: "Belgian Dark Chocolate Truffle Cake",
    slug: "belgian-dark-chocolate-truffle-cake",
    price: 649,
    compareAtPrice: 799,
    rating: 4.9,
    reviewCount: 128,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Artisanal Cakes",
    isEggless: true,
    isBestseller: true,
    description: "Rich 55% dark chocolate ganache layered between soft cocoa sponges.",
  },
  {
    id: "prod-2",
    name: "Classic Red Velvet Cream Cheese Cake",
    slug: "classic-red-velvet-cream-cheese-cake",
    price: 699,
    compareAtPrice: 849,
    rating: 4.8,
    reviewCount: 94,
    image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Artisanal Cakes",
    isEggless: true,
    isBestseller: true,
    description: "Velvety red sponge cake with cream cheese frosting.",
  },
  {
    id: "prod-3",
    name: "Fresh Blueberry Cheesecake Tart",
    slug: "fresh-blueberry-cheesecake-tart",
    price: 349,
    compareAtPrice: 429,
    rating: 4.7,
    reviewCount: 62,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Pastries & Tarts",
    isEggless: false,
    description: "Buttery tart shell filled with New York style cheesecake and wild blueberry compote.",
  },
  {
    id: "prod-4",
    name: "Almond Croissant & Butter Brioche",
    slug: "almond-croissant-butter-brioche",
    price: 199,
    rating: 4.9,
    reviewCount: 45,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Fresh Breads",
    isEggless: false,
    description: "Flaky French butter croissants filled with rich frangipane almond cream.",
  },
  {
    id: "prod-5",
    name: "Golden Metallic Happy Birthday Candle Set",
    slug: "golden-metallic-happy-birthday-candle-set",
    price: 149,
    compareAtPrice: 199,
    rating: 4.9,
    reviewCount: 78,
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Party Decorations",
    isEggless: true,
    isBestseller: true,
    description: "Premium food-safe metallic gold candles for milestone birthday cakes.",
  },
  {
    id: "prod-6",
    name: "Pastel Balloon Arch Decoration Set (50 Pcs)",
    slug: "pastel-balloon-arch-decoration-set",
    price: 399,
    compareAtPrice: 499,
    rating: 4.8,
    reviewCount: 52,
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Party Decorations",
    isEggless: true,
    isBestseller: true,
    description: "Macaron pastel shade balloon arch kit with ribbon and glue dots.",
  },
  {
    id: "prod-7",
    name: "Acrylic Custom Name Cake Topper",
    slug: "acrylic-custom-name-cake-topper",
    price: 249,
    compareAtPrice: 299,
    rating: 4.9,
    reviewCount: 41,
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Party Decorations",
    isEggless: true,
    description: "Reusable mirrored gold acrylic topper customized for your celebration.",
  },
  {
    id: "prod-8",
    name: "Confetti Party Popper Streamer Pack",
    slug: "confetti-party-popper-streamer-pack",
    price: 199,
    compareAtPrice: 249,
    rating: 4.7,
    reviewCount: 36,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Party Decorations",
    isEggless: true,
    description: "Biodegradable paper confetti cannons for cake cutting moments.",
  },
  {
    id: "prod-9",
    name: "Dutch Choco Lava Molten Cake (Pack of 2)",
    slug: "dutch-choco-lava-molten-cake",
    price: 249,
    compareAtPrice: 299,
    rating: 4.9,
    reviewCount: 110,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Pastries & Tarts",
    isEggless: true,
    isBestseller: true,
    description: "Warm molten chocolate core oozing with premium Belgian ganache.",
  },
  {
    id: "prod-10",
    name: "Artisanal Multigrain Sourdough Loaf",
    slug: "artisanal-multigrain-sourdough-loaf",
    price: 169,
    compareAtPrice: 199,
    rating: 4.8,
    reviewCount: 64,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Fresh Breads",
    isEggless: true,
    description: "Naturally fermented 36-hour sourdough with crispy crust and soft airy crumb.",
  },
];

export const MOCK_COMBOS: MockCombo[] = [
  {
    id: "combo-1",
    title: "Birthday Party Celebration Combo",
    items: ["1kg Belgian Chocolate Cake", "12 Assorted Macarons", "2 Party Poppers"],
    price: 1199,
    originalPrice: 1499,
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "combo-2",
    title: "High Tea Pastry & Cookie Box",
    items: ["4 Tart Slices", "1 Box Almond Cookies", "2 Sourdough Loaves"],
    price: 899,
    originalPrice: 1099,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
  },
];

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: "rev-1",
    name: "Ananya Sharma",
    rating: 5,
    comment: "The Belgian Dark Chocolate Truffle was unbelievable! Perfectly moist and rich. Ordered for my mom's birthday.",
    date: "2 days ago",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "rev-2",
    name: "Rohan Verma",
    rating: 5,
    comment: "Best eggless bakery in town. Delivery was super fast and the packaging kept the cake in pristine condition.",
    date: "1 week ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  },
];
