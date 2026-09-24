import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";

import { Badge, Card, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  customerDashboardService,
  type SupportTicket,
} from "@/services/customerDashboard.service";

const FAQS = [
  {
    q: "How do I track my cake preparation & delivery?",
    a: "You can track live baking and delivery progress in real-time on your 'My Orders' page using the Flipkart-style progress tracker.",
  },
  {
    q: "Can I customize the text or design on my birthday cake?",
    a: "Yes! Use our dedicated 'Custom Cake Studio' from the menu or specify your message in the special instructions box on the checkout page.",
  },
  {
    q: "What if my delivery location is in an outer village or rural route?",
    a: "Onebite Bakery delivers to all registered regional village routes. You can verify your village by clicking the Location selector in the top bar.",
  },
  {
    q: "What is the cancellation and refund policy?",
    a: "Orders can be modified or cancelled before the bakery begins baking (CONFIRMED status). Instant refunds are credited back to your original payment method within 24-48 hours.",
  },
];

export const CustomerSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    customerDashboardService.getSupportTickets(),
  );
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    subject: "",
    category: "Order Support",
    message: "",
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;

    const created = customerDashboardService.createSupportTicket({
      subject: form.subject.trim(),
      category: form.category,
      message: form.message.trim(),
    });

    setTickets((prev) => [created, ...prev]);
    setIsTicketModalOpen(false);
    setForm({ subject: "", category: "Order Support", message: "" });
    setStatusMsg("Support ticket created! Our bakery support manager will respond promptly.");
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleWhatsAppHelp = () => {
    const text = encodeURIComponent(
      "Hi Onebite Bakery! I need assistance regarding my account / order.",
    );
    window.open(`https://wa.me/917897671632?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DEC9] pb-4">
        <div className="space-y-1">
          <Link
            to="/customer/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E65] hover:text-[#596B58] transition-colors mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Account Hub</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B] flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-[#596B58]" />
            <span>Customer Help & Support</span>
          </h1>
          <p className="text-xs text-[#7A6E65]">
            24/7 dedicated customer care, instant WhatsApp assistance, and issue ticketing
          </p>
        </div>

        <Button
          onClick={() => setIsTicketModalOpen(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Raise Support Ticket</span>
        </Button>
      </div>

      {statusMsg ? (
        <div className="p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      ) : null}

      {/* Direct Contact Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3 bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-green-600 text-white shadow-sm">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-green-950">WhatsApp 24/7 Helpline</h3>
              <p className="text-xs text-green-800">Direct chat with our head chef & delivery team</p>
            </div>
          </div>
          <Button
            onClick={handleWhatsAppHelp}
            className="w-full bg-green-600 hover:bg-green-700 text-white border-none shadow-sm flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat on WhatsApp (+91 7897671632)</span>
          </Button>
        </Card>

        <Card className="p-5 space-y-3 bg-gradient-to-br from-[#FFF8EC] to-[#F7F2E7]/40 border-[#596B58]/30">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#596B58] text-white shadow-sm">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#3B302B]">Order Issue Ticketing</h3>
              <p className="text-xs text-[#7A6E65]">Submit detailed queries, refunds, or bakery feedback</p>
            </div>
          </div>
          <Button
            onClick={() => setIsTicketModalOpen(true)}
            variant="outline"
            className="w-full border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC] flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Open New Support Ticket</span>
          </Button>
        </Card>
      </div>

      {/* Support Ticket History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#3B302B]">Your Support Tickets ({tickets.length})</h2>
          <span className="text-xs text-[#7A6E65]">Track open tickets & resolutions</span>
        </div>

        {tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((t) => (
              <Card key={t.id} className="p-5 space-y-3 border-[#E5DEC9]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DEC9] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#3B302B]">{t.subject}</span>
                      <Badge variant={t.status === "RESOLVED" ? "success" : "warning"}>
                        {t.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#7A6E65] mt-0.5">
                      Category: <strong>{t.category}</strong> &bull; Created on {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">ID: #{t.id.slice(0, 8)}</span>
                </div>

                <p className="text-xs text-[#3B302B] bg-[#FFF8EC] p-3 rounded-xl border border-[#E5DEC9]">
                  {t.message}
                </p>

                {t.status === "RESOLVED" ? (
                  <div className="text-xs text-green-700 font-semibold flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Issue verified and resolved by Onebite Bakery Customer Support.</span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 font-medium pt-1">
                    ⏳ In review by support team &bull; Average response time: &lt; 30 minutes
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10 space-y-2 border-dashed">
            <LifeBuoy className="h-8 w-8 text-gray-400 mx-auto opacity-50" />
            <p className="text-xs font-bold text-[#3B302B]">No active support tickets</p>
            <p className="text-xs text-[#7A6E65]">Need assistance? Raise a ticket anytime or reach out via WhatsApp.</p>
          </Card>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-[#596B58]" />
          <h2 className="text-lg font-extrabold text-[#3B302B]">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <Card
                key={idx}
                className="p-4 cursor-pointer hover:border-[#596B58]/50 transition-colors"
                onClick={() => setExpandedFaq(isExpanded ? null : idx)}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-xs sm:text-sm text-[#3B302B]">{faq.q}</h4>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#596B58] shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                </div>
                {isExpanded ? (
                  <p className="text-xs text-[#7A6E65] mt-2 pt-2 border-t border-[#E5DEC9] leading-relaxed animate-in fade-in">
                    {faq.a}
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Raise Customer Support Ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
          <Input
            label="Subject / Issue Summary *"
            placeholder="e.g. Delivery delay inquiry, Special candle request"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#3B302B]">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] focus:outline-none focus:border-[#596B58]"
            >
              <option value="Order Support">Order Support & Status</option>
              <option value="Delivery Issue">Delivery Timing / Address Issue</option>
              <option value="Payment & Refunds">Payment & Refund Inquiries</option>
              <option value="Cake Quality">Cake Taste & Quality Feedback</option>
              <option value="Custom Cake Design">Custom Cake Design Query</option>
              <option value="General Inquiry">Other Account Inquiry</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#3B302B]">Detailed Description *</label>
            <textarea
              rows={4}
              placeholder="Please explain the details of your issue or request..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full p-3 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-white"
              required
            />
          </div>

          <Button type="submit" className="w-full mt-4 flex items-center justify-center gap-2">
            <Send className="h-4 w-4" />
            <span>Submit Ticket</span>
          </Button>
        </form>
      </Modal>
    </div>
  );
};
