export const SITE_CONFIG = {
  name: "OneBite Bakery",
  legalName: "OneBite Bakery",
  domain: "https://onebite-bakery-platform.vercel.app",
  defaultTitle: "OneBite Bakery | Cakes, Pastries & Custom Cakes",
  titleTemplate: "%s | OneBite Bakery",
  defaultDescription:
    "Order fresh handcrafted cakes, birthday cakes, custom celebratory cakes, artisanal pastries, combos, and party decoration items online from OneBite Bakery. Fast local delivery in Hamirpur, UP.",
  defaultImage: "https://onebite-bakery-platform.vercel.app/logo.png",
  logoUrl: "https://onebite-bakery-platform.vercel.app/logo.svg",
  contact: {
    phone: "+91 7897671632",
    telephone: "+917897671632",
    email: "ajaykterha@gmail.com",
    address: {
      streetAddress: "N 80°14, terha 25°49'43.3, 54.7\"E",
      addressLocality: "Terha",
      addressRegion: "Hamirpur",
      addressCountry: "IN",
      postalCode: "210502",
      addressState: "Uttar Pradesh",
    },
    geo: {
      latitude: 25.828694,
      longitude: 80.248528,
    },
    openingHours: "Mo-Su 08:00-22:00",
    openingHoursDisplay: "Monday – Sunday: 8:00 AM – 10:00 PM",
    priceRange: "₹₹",
    servesCuisine: ["Bakery", "Artisanal Cakes", "Pastries", "Sourdough Breads", "Custom Celebration Cakes"],
  },
  social: {
    facebook: "https://facebook.com/onebitebakery",
    instagram: "https://instagram.com/onebitebakery",
  },
} as const;
