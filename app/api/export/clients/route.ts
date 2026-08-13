import ExcelJS from "exceljs";
import { getStore } from "@/lib/data/store";
import { getAllClientStats } from "@/lib/data/analytics";

export async function GET() {
  const store = await getStore();
  const stats = getAllClientStats(store);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Clients");
  sheet.columns = [
    { header: "ID", key: "id", width: 12 },
    { header: "Company", key: "company", width: 32 },
    { header: "Industry", key: "industry", width: 24 },
    { header: "Status", key: "status", width: 12 },
    { header: "City", key: "city", width: 16 },
    { header: "State", key: "state", width: 10 },
    { header: "Total Projects", key: "totalProjects", width: 14 },
    { header: "Total Invoiced", key: "totalInvoiced", width: 16 },
    { header: "Outstanding", key: "outstandingBalance", width: 14 },
    { header: "Client Since", key: "since", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const c of store.clients) {
    const s = stats.get(c.id) ?? { totalProjects: 0, totalInvoiced: 0, outstandingBalance: 0 };
    sheet.addRow({
      id: c.id,
      company: c.company,
      industry: c.industry,
      status: c.status,
      city: c.city,
      state: c.state,
      totalProjects: s.totalProjects,
      totalInvoiced: s.totalInvoiced,
      outstandingBalance: s.outstandingBalance,
      since: c.since.slice(0, 10),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="opsynq-clients-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
