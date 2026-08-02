import React, { useState } from "react";
import { Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";

import { Badge, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { AdminPageHeader, AdminToolbar } from "../components/AdminComponents";
import { MediaUploader } from "../catalog/MediaUploader";

interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  entityType: string;
  size: string;
  createdAt: string;
}

const INITIAL_ASSETS: MediaAsset[] = [
  {
    id: "med-1",
    filename: "belgian-truffle-cake-main.jpg",
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
    entityType: "PRODUCT",
    size: "1.2 MB",
    createdAt: new Date().toISOString(),
  },
  {
    id: "med-2",
    filename: "red-velvet-cheesecake-banner.jpg",
    url: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80",
    entityType: "CATEGORY",
    size: "890 KB",
    createdAt: new Date().toISOString(),
  },
  {
    id: "med-3",
    filename: "birthday-celebration-hero.jpg",
    url: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80",
    entityType: "OCCASION",
    size: "1.5 MB",
    createdAt: new Date().toISOString(),
  },
];

export const AdminMediaPage: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>(INITIAL_ASSETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const handleAddMedia = () => {
    if (!newUrl) return;
    const newAsset: MediaAsset = {
      id: `med-${Date.now()}`,
      filename: `media-asset-${Date.now()}.jpg`,
      url: newUrl,
      entityType: "PRODUCT",
      size: "650 KB",
      createdAt: new Date().toISOString(),
    };
    setAssets([newAsset, ...assets]);
    setNewUrl("");
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
  };

  const filtered = assets.filter(
    (a) =>
      a.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bakery Media & Asset Repository"
        description="Section 58 &bull; Upload, preview, and manage product images, banner posters, and category graphics."
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Upload New Media Asset</span>
          </Button>
        }
      />

      <AdminToolbar searchPlaceholder="Search asset filename or tag..." onSearchChange={setSearchQuery} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((asset) => (
          <div key={asset.id} className="rounded-2xl border border-[#E8E2D9] bg-white p-4 space-y-3 shadow-xs hover:shadow-md transition-shadow">
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#F9F6F0] border border-[#E8E2D9] group">
              <img
                src={asset.url}
                alt={asset.filename}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";
                }}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => handleDelete(asset.id)}
                className="absolute top-2 right-2 p-2 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                title="Delete Media Asset"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="primary">{asset.entityType}</Badge>
                <span className="text-[10px] text-gray-400">{asset.size}</span>
              </div>
              <p className="text-xs font-bold text-[#2C1E16] truncate">{asset.filename}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">{asset.url}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Media Asset">
        <div className="space-y-4 pt-2">
          <MediaUploader value={newUrl} onChange={setNewUrl} entityType="PRODUCT" />
          <Button onClick={handleAddMedia} className="w-full" disabled={!newUrl}>
            Save to Media Repository
          </Button>
        </div>
      </Modal>
    </div>
  );
};
