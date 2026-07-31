import React from "react";
import { Award, Cake, Heart, ShieldCheck } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-16 pb-16">
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-12 text-center space-y-4">
        <span className="text-xs font-bold text-[#E67E22] uppercase tracking-wider">Our Story & Craft</span>
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Handcrafted with Passion & Precision</h1>
        <p className="text-sm text-[#6E5D4F] max-w-2xl mx-auto leading-relaxed">
          Founded in 2021, OneBite Bakery started with a simple vision: to bring authentic French pâtisserie techniques and artisanal sourdough baking to everyday celebrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-8 space-y-3 text-center">
          <Cake className="h-10 w-10 text-[#E67E22] mx-auto" />
          <h3 className="text-lg font-bold text-[#2C1E16]">Uncompromising Quality</h3>
          <p className="text-xs text-[#6E5D4F]">We use 100% pure butter, 55% Belgian dark chocolate, and organic flours.</p>
        </div>
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-8 space-y-3 text-center">
          <Heart className="h-10 w-10 text-[#C0392B] mx-auto" />
          <h3 className="text-lg font-bold text-[#2C1E16]">Dedicated Eggless Kitchen</h3>
          <p className="text-xs text-[#6E5D4F]">Separate baking equipment ensuring strict dietary preference safety.</p>
        </div>
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-8 space-y-3 text-center">
          <Award className="h-10 w-10 text-[#27AE60] mx-auto" />
          <h3 className="text-lg font-bold text-[#2C1E16]">Master Craftsmen</h3>
          <p className="text-xs text-[#6E5D4F]">Led by pastry chefs trained in top culinary institutions worldwide.</p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  return (
    <div className="space-y-12 pb-16">
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Get in Touch</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Have a question about custom tier cake orders or store pickup? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div className="space-y-6 bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-[#2C1E16]">Send Us a Message</h3>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-bold text-[#2C1E16] mb-1">Your Name</label>
              <input type="text" placeholder="John Doe" className="w-full p-3 rounded-lg border border-[#E8E2D9] text-sm outline-none focus:border-[#E67E22]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C1E16] mb-1">Phone / Email</label>
              <input type="text" placeholder="john@example.com" className="w-full p-3 rounded-lg border border-[#E8E2D9] text-sm outline-none focus:border-[#E67E22]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C1E16] mb-1">Message</label>
              <textarea placeholder="Tell us about your custom cake request or query..." rows={4} className="w-full p-3 rounded-lg border border-[#E8E2D9] text-sm outline-none focus:border-[#E67E22]" />
            </div>
            <button type="submit" className="w-full py-3 bg-[#E67E22] text-white font-bold rounded-lg hover:bg-[#D35400] transition-colors">
              Submit Message
            </button>
          </form>
        </div>

        <div className="space-y-6 bg-[#2C1E16] text-[#FFFBF5] rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-[#E67E22]">Store Location & Hours</h3>
          <div className="space-y-4 text-xs text-[#E8E2D9]/80 leading-relaxed">
            <p><strong>Address:</strong> 123 Artisanal Bakery Lane, Connaught Place, New Delhi 110001</p>
            <p><strong>Phone:</strong> +91 98765 43210</p>
            <p><strong>Email:</strong> orders@onebitebakery.test</p>
            <p><strong>Store Pickup Hours:</strong> Monday – Sunday: 8:00 AM – 10:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};
