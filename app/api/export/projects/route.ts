import ExcelJS from "exceljs";
import { getStore } from "@/lib/data/store";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();
  const { projects, clients } = await getStore();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Projects");
  sheet.columns = [
    { header: "ID", key: "id", width: 12 },
    { header: "Name", key: "name", width: 32 },
    { header: "Client", key: "client", width: 26 },
    { header: "Category", key: "category", width: 14 },
    { header: "Status", key: "status", width: 16 },
    { header: "Risk Level", key: "riskLevel", width: 12 },
    { header: "Budget", key: "budget", width: 14 },
    { header: "Spent", key: "spent", width: 14 },
    { header: "Progress %", key: "progress", width: 12 },
    { header: "City", key: "city", width: 16 },
    { header: "State", key: "state", width: 10 },
    { header: "Start Date", key: "startDate", width: 14 },
    { header: "Deadline", key: "deadline", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const p of projects) {
    const client = clients.find((c) => c.id === p.clientId);
    sheet.addRow({
      id: p.id,
      name: p.name,
      client: client?.company ?? "",
      category: p.category,
      status: p.status,
      riskLevel: p.riskLevel,
      budget: p.budget,
      spent: p.spent,
      progress: p.progress,
      city: p.city,
      state: p.state,
      startDate: p.startDate.slice(0, 10),
      deadline: p.deadline.slice(0, 10),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="opsynq-projects-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
