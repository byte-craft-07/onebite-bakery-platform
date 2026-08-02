import React from "react";
import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, Phone, Share2 } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E8E2D9] bg-[#2C1E16] text-[#FFFBF5] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold text-[#E67E22]">OneBite Bakery</h3>
            <p className="text-xs font-extrabold text-[#E8E2D9] tracking-wider">
              हर जश्न का पहला निवाला। &bull; Pure Joy in Every Single Bite
            </p>
          </div>
          <p className="text-xs text-[#E8E2D9]/80 leading-relaxed">
            Handcrafted artisanal cakes, pastries, custom cake creations, and fresh daily breads prepared with premium 100% natural ingredients.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-[#E67E22] transition-colors"><Share2 className="h-4 w-4" /></a>
            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-[#E67E22] transition-colors"><Mail className="h-4 w-4" /></a>
            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-[#E67E22] transition-colors"><Phone className="h-4 w-4" /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#E67E22] uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2 text-xs text-[#E8E2D9]/80">
            <li><Link to="/products" className="hover:text-white transition-colors">Our Catalog</Link></li>
            <li><Link to="/categories" className="hover:text-white transition-colors">Browse Categories</Link></li>
            <li><Link to="/occasions" className="hover:text-white transition-colors">Special Occasions</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Our Story & Craft</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact & Store Pickup</Link></li>
          </ul>
        </div>

        {/* Popular Items */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#E67E22] uppercase tracking-wider">Top Favorites</h4>
          <ul className="space-y-2 text-xs text-[#E8E2D9]/80">
            <li>Belgian Chocolate Truffle</li>
            <li>Classic Red Velvet Cake</li>
            <li>Eggless Blueberry Cheesecake</li>
            <li>Almond Butter Croissants</li>
            <li>Custom Birthday Tier Cakes</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 text-xs text-[#E8E2D9]/80">
          <h4 className="text-sm font-bold text-[#E67E22] uppercase tracking-wider">Store Location</h4>
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-[#E67E22] shrink-0 mt-0.5" />
            <span>123 Artisanal Bakery Lane, Connaught Place, New Delhi 110001</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-[#E67E22] shrink-0" />
            <span>+91 98765 43210</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-[#E67E22] shrink-0" />
            <span>orders@onebitebakery.test</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-[#E67E22] shrink-0" />
            <span>Mon - Sun: 8:00 AM - 10:00 PM</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-white/10 text-center text-xs text-[#E8E2D9]/60">
        <p>&copy; {new Date().getFullYear()} OneBite Bakery Platform &bull; हर जश्न का पहला निवाला। (Pure Joy in Every Single Bite). All rights reserved.</p>
      </div>
    </footer>
  );
};
