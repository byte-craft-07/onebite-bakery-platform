import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Cake, CheckCircle2, Gift, Heart, Plus, Sparkles, Trash2 } from "lucide-react";

import { Badge, Card, EmptyState, Modal, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  customerDashboardService,
  type CelebrationItem,
} from "@/services/customerDashboard.service";

export const CustomerCelebrationsPage: React.FC = () => {
  const [celebrations, setCelebrations] = useState<CelebrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "Birthday" as CelebrationItem["type"],
    date: "",
    reminderEnabled: true,
  });

  const loadCelebrations = () => {
    setIsLoading(true);
    try {
      const list = customerDashboardService.getCelebrations();
      setCelebrations(list);
    } catch (_err) {
      setCelebrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCelebrations();
  }, []);

  const handleSaveCelebration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;

    const newItem = customerDashboardService.addCelebration({
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      reminderEnabled: form.reminderEnabled,
    });

    setCelebrations((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setForm({
      title: "",
      type: "Birthday",
      date: "",
      reminderEnabled: true,
    });
    setStatusMsg("Celebration event added! You will receive timely cake reminders.");
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeleteCelebration = (id: string) => {
    customerDashboardService.deleteCelebration(id);
    setCelebrations((prev) => prev.filter((c) => c.id !== id));
    setStatusMsg("Celebration event removed.");
    setTimeout(() => setStatusMsg(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
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
            <Cake className="h-6 w-6 text-[#596B58]" />
            <span>Celebration Reminder Calendar</span>
          </h1>
          <p className="text-xs text-[#7A6E65]">
            Never miss birthdays, anniversaries, or special family milestones &bull; Get advance cake offers!
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Add Celebration Date</span>
        </Button>
      </div>

      {statusMsg ? (
        <div className="p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      ) : null}

      {/* Celebrations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : celebrations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {celebrations.map((cel) => (
            <Card
              key={cel.id}
              className="p-5 space-y-4 border-[#E5DEC9] bg-[#FFF8EC] relative flex flex-col justify-between hover:border-[#596B58]/50 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={cel.type === "Birthday" ? "primary" : cel.type === "Anniversary" ? "success" : "neutral"}>
                    {cel.type === "Birthday" ? "🎂 Birthday" : cel.type === "Anniversary" ? "💍 Anniversary" : "🎉 " + cel.type}
                  </Badge>
                  <button
                    onClick={() => handleDeleteCelebration(cel.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                    title="Delete Reminder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#3B302B]">{cel.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#7A6E65] mt-1 font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-[#596B58]" />
                    <span>{cel.date}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-between gap-2">
                <span className="text-[10px] text-green-700 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-full font-bold">
                  {cel.reminderEnabled ? "✓ Reminder Active" : "Reminder Muted"}
                </span>

                <Link to="/custom-cake">
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">
                    <Sparkles className="h-3 w-3 mr-1 text-[#596B58]" />
                    <span>Plan Cake</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Celebrations Added Yet"
          description="Save upcoming birthdays and anniversaries to get advance celebration reminders and exclusive surprise coupons."
          action={
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Your First Event</span>
            </Button>
          }
        />
      )}

      {/* Add Celebration Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Celebration Reminder"
      >
        <form onSubmit={handleSaveCelebration} className="space-y-4 pt-2">
          <Input
            label="Celebration Title / Person Name *"
            placeholder="e.g. Mom's 50th Birthday, Wedding Anniversary"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#3B302B]">Occasion Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(["Birthday", "Anniversary", "Wedding", "Festival", "Other"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                    form.type === t
                      ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58]"
                      : "border-[#E5DEC9] bg-white text-[#7A6E65]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Date of Celebration *"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={form.reminderEnabled}
                onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })}
                className="rounded border-gray-300 text-[#596B58] h-4 w-4"
              />
              <span>Send me reminders 3 days before this date</span>
            </label>
          </div>

          <Button type="submit" className="w-full mt-4">
            Save Celebration Event
          </Button>
        </form>
      </Modal>
    </div>
  );
};
