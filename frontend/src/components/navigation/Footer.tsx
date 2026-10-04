import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Download, Mail, MapPin, Phone, Share2, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RatingModal } from "@/components/review/RatingModal";
import { usePWA } from "@/hooks/usePWA";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const { isStandalone, promptInstall } = usePWA();

  return (
    <footer className="border-t border-[#E5DEC9] bg-[#3B302B] text-[#FFF8EC] pt-12 sm:pt-16 pb-28 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 flex items-center justify-center">
              <img
                src="/logo.svg"
                alt="Onebite Bakery Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#D8BE91]">Onebite Bakery</h3>
              <p className="text-[11px] font-extrabold text-[#FFF8EC]/90 tracking-wider">
                हर जश्न का पहला निवाला &bull; 100% Pure Joy
              </p>
            </div>
          </div>
          <p className="text-xs text-[#FFF8EC]/80 leading-relaxed">
            Handcrafted artisanal cakes, pastries, custom cake creations, and fresh daily breads prepared with premium 100% natural ingredients.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-[#596B58] text-[#FFF8EC] transition-colors"><Share2 className="h-4 w-4" /></a>
            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-[#596B58] text-[#FFF8EC] transition-colors"><Mail className="h-4 w-4" /></a>
            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-[#596B58] text-[#FFF8EC] transition-colors"><Phone className="h-4 w-4" /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#D8BE91] uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2 text-xs text-[#FFF8EC]/80">
            <li><Link to="/products" className="hover:text-[#D8BE91] transition-colors">{t("navigation.products", "Our Catalog")}</Link></li>
            <li><Link to="/categories" className="hover:text-[#D8BE91] transition-colors">{t("navigation.categories", "Browse Categories")}</Link></li>
            <li><Link to="/custom-cake" className="hover:text-[#D8BE91] transition-colors">Custom Cake Studio</Link></li>
            <li><Link to="/combos" className="hover:text-[#D8BE91] transition-colors">Combos &amp; Hampers</Link></li>
            <li><Link to="/decorations" className="hover:text-[#D8BE91] transition-colors">Party Decorations</Link></li>
            <li><Link to="/occasions" className="hover:text-[#D8BE91] transition-colors">{t("navigation.occasions", "Special Occasions")}</Link></li>
            <li><Link to="/offers" className="hover:text-[#D8BE91] text-[#D8BE91] font-bold transition-colors">{t("navigation.offers", "Offers & Coupons")}</Link></li>
            <li>
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(true)}
                className="text-[#D8BE91] hover:text-[#FFF8EC] font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{t("reviews.writeReview", "Rate Our Bakery / Write Review")}</span>
              </button>
            </li>
            {!isStandalone && (
              <li>
                <button
                  type="button"
                  onClick={promptInstall}
                  className="text-[#D8BE91] hover:text-[#FFF8EC] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-[#D8BE91]" />
                  <span>{t("common.installApp", "Install App")}</span>
                </button>
              </li>
            )}
            <li><Link to="/about" className="hover:text-[#D8BE91] transition-colors">{t("navigation.aboutUs", "About Us")}</Link></li>
            <li><Link to="/contact" className="hover:text-[#D8BE91] transition-colors">{t("navigation.contactUs", "Contact & Store Pickup")}</Link></li>
          </ul>
        </div>

        {/* Popular Items - Internal Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#D8BE91] uppercase tracking-wider">{t("products.bestseller", "Top Favorites")}</h4>
          <ul className="space-y-2 text-xs text-[#FFF8EC]/80">
            <li>
              <Link to="/products/belgian-dark-chocolate-truffle-cake" className="hover:text-[#D8BE91] transition-colors">
                Belgian Dark Chocolate Cake
              </Link>
            </li>
            <li>
              <Link to="/products/classic-red-velvet-cream-cheese-cake" className="hover:text-[#D8BE91] transition-colors">
                Classic Red Velvet Cake
              </Link>
            </li>
            <li>
              <Link to="/products/fresh-blueberry-cheesecake-tart" className="hover:text-[#D8BE91] transition-colors">
                Fresh Blueberry Cheesecake Tart
              </Link>
            </li>
            <li>
              <Link to="/products/almond-croissant-butter-brioche" className="hover:text-[#D8BE91] transition-colors">
                Almond Butter Croissants
              </Link>
            </li>
            <li>
              <Link to="/custom-cake" className="hover:text-[#D8BE91] transition-colors">
                Custom Birthday Tier Cakes
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 text-xs text-[#FFF8EC]/80">
          <h4 className="text-sm font-bold text-[#D8BE91] uppercase tracking-wider">{t("checkout.pickupStoreAddress", "Store Location")}</h4>
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-[#D8BE91] shrink-0 mt-0.5" />
            <span>Onebite Bakery, N 80°14, terha 25°49'43.3, 54.7"E, hamirpur, Uttar Pradesh 210502</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-[#D8BE91] shrink-0" />
            <span>+91 7897671632</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-[#D8BE91] shrink-0" />
            <span>ajaykterha@gmail.com</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-[#D8BE91] shrink-0" />
            <span>{t("checkout.openDaily", "Mon - Sun: 8:00 AM - 10:00 PM")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FFF8EC]/60">
        <p>&copy; {new Date().getFullYear()} Onebite Bakery &bull; {t("common.freshBakedDaily", "Freshly Baked Daily")}. {t("common.allRightsReserved", "All rights reserved.")}</p>
        <div className="flex items-center gap-3">
          <span className="text-[11px]">{t("common.selectLanguage", "Language")}:</span>
          <LanguageSwitcher variant="compact" />
        </div>
      </div>

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
      />
    </footer>
  );
};
