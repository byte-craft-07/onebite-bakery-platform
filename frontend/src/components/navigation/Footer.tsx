import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Download, Mail, MapPin, Phone, Share2, Star } from "lucide-react";
import { RatingModal } from "@/components/review/RatingModal";
import { usePWA } from "@/hooks/usePWA";

export const Footer: React.FC = () => {
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
            <li><Link to="/products" className="hover:text-[#D8BE91] transition-colors">Our Catalog</Link></li>
            <li><Link to="/categories" className="hover:text-[#D8BE91] transition-colors">Browse Categories</Link></li>
            <li><Link to="/occasions" className="hover:text-[#D8BE91] transition-colors">Special Occasions</Link></li>
            <li><Link to="/offers" className="hover:text-[#D8BE91] text-[#D8BE91] font-bold transition-colors">Offers & Coupons</Link></li>
            <li>
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(true)}
                className="text-[#D8BE91] hover:text-[#FFF8EC] font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>Rate Our Bakery / Write Review</span>
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
                  <span>Install App (Mobile & Desktop)</span>
                </button>
              </li>
            )}
            <li><Link to="/about" className="hover:text-[#D8BE91] transition-colors">Our Story & Craft</Link></li>
            <li><Link to="/contact" className="hover:text-[#D8BE91] transition-colors">Contact & Store Pickup</Link></li>
          </ul>
        </div>

        {/* Popular Items */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#D8BE91] uppercase tracking-wider">Top Favorites</h4>
          <ul className="space-y-2 text-xs text-[#FFF8EC]/80">
            <li>Belgian Chocolate Truffle</li>
            <li>Classic Red Velvet Cake</li>
            <li>Eggless Blueberry Cheesecake</li>
            <li>Almond Butter Croissants</li>
            <li>Custom Birthday Tier Cakes</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 text-xs text-[#FFF8EC]/80">
          <h4 className="text-sm font-bold text-[#D8BE91] uppercase tracking-wider">Store Location</h4>
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
            <span>Mon - Sun: 8:00 AM - 10:00 PM</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-white/10 text-center text-xs text-[#FFF8EC]/60">
        <p>&copy; {new Date().getFullYear()} Onebite Bakery Platform &bull; हर जश्न का पहला निवाला। (Pure Joy in Every Single Bite). All rights reserved.</p>
      </div>

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
      />
    </footer>
  );
};
