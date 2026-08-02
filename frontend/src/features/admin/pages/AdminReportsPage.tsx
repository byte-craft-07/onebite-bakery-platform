import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, Filter, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { AdminCard, AdminPageHeader, AdminTable } from "../components/AdminComponents";

interface ReportItem {
  id: string;
  name: string;
  category: "FINANCIAL" | "INVENTORY" | "ORDERS" | "TAX";
  fileType: "PDF" | "CSV" | "EXCEL";
  generatedDate: string;
  size: string;
}

const REPORTS_LIST: ReportItem[] = [
  {
    id: "rep-1",
    name: "Monthly Revenue & GST Tax Summary Report (Q3)",
    category: "TAX",
    fileType: "PDF",
    generatedDate: new Date().toLocaleDateString(),
    size: "2.4 MB",
  },
  {
    id: "rep-2",
    name: "Full Product Inventory Stock Count Audit",
    category: "INVENTORY",
    fileType: "EXCEL",
    generatedDate: new Date().toLocaleDateString(),
    size: "1.1 MB",
  },
  {
    id: "rep-3",
    name: "Completed Home Delivery Orders Log",
    category: "ORDERS",
    fileType: "CSV",
    generatedDate: new Date().toLocaleDateString(),
    size: "850 KB",
  },
];

export const AdminReportsPage: React.FC = () => {
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const handleDownload = (reportName: string) => {
    setDownloadMsg(`Preparing download for "${reportName}"...`);
    setTimeout(() => {
      setDownloadMsg(`Report "${reportName}" downloaded successfully.`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Financial & Inventory Reports Engine"
        description="Section 60 &bull; Generate and export downloadable GST tax ledgers, revenue breakdown reports, and inventory logs."
      />

      {downloadMsg ? (
        <div className="p-3 bg-green-50 text-green-800 text-xs font-bold rounded-xl border border-green-200 animate-in fade-in">
          {downloadMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminCard className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#6E5D4F]">
            <span>Monthly GST Tax Ledger</span>
            <FileText className="h-5 w-5 text-[#E67E22]" />
          </div>
          <p className="text-xs text-[#6E5D4F]">Detailed breakdown of 5% GST tax collected on all online orders.</p>
          <Button size="sm" className="w-full" onClick={() => handleDownload("Monthly GST Tax Ledger.pdf")}>
            <Download className="h-4 w-4 mr-1.5" />
            <span>Export Tax PDF</span>
          </Button>
        </AdminCard>

        <AdminCard className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#6E5D4F]">
            <span>Inventory Stock Report</span>
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xs text-[#6E5D4F]">Real-time stock quantities, low-stock warnings, and SKU counts.</p>
          <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownload("Inventory Stock Report.xlsx")}>
            <Download className="h-4 w-4 mr-1.5" />
            <span>Export Excel Log</span>
          </Button>
        </AdminCard>

        <AdminCard className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#6E5D4F]">
            <span>Completed Orders CSV</span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xs text-[#6E5D4F]">Full dispatch orders history with customer phone and amounts.</p>
          <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownload("Orders History.csv")}>
            <Download className="h-4 w-4 mr-1.5" />
            <span>Export Orders CSV</span>
          </Button>
        </AdminCard>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#2C1E16]">Generated Reports Archives</h3>
        <AdminTable headers={["Report Document Name", "Category Tag", "File Format", "Date Generated", "File Size", "Download"]}>
          {REPORTS_LIST.map((rep) => (
            <tr key={rep.id} className="hover:bg-[#F9F6F0]/50 transition-colors">
              <td className="px-4 py-3 font-bold text-[#2C1E16]">{rep.name}</td>
              <td className="px-4 py-3">
                <Badge variant="primary">{rep.category}</Badge>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{rep.fileType}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{rep.generatedDate}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{rep.size}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDownload(rep.name)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFF3E6] text-[#E67E22] font-bold text-xs hover:bg-[#E67E22] hover:text-white transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
};
