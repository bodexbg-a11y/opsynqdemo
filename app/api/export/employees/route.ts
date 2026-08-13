import ExcelJS from "exceljs";
import { getStore } from "@/lib/data/store";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();
  const { employees, teams } = await getStore();
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Employees");
  sheet.columns = [
    { header: "ID", key: "id", width: 12 },
    { header: "Name", key: "name", width: 26 },
    { header: "Role", key: "role", width: 24 },
    { header: "Department", key: "department", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "City", key: "city", width: 16 },
    { header: "Employment Type", key: "employmentType", width: 16 },
    { header: "Status", key: "status", width: 12 },
    { header: "Team", key: "team", width: 26 },
    { header: "Hire Date", key: "hireDate", width: 14 },
    { header: "Weekly Hours", key: "weeklyHours", width: 13 },
    { header: "Performance", key: "performanceScore", width: 12 },
    { header: "Access Level", key: "permission", width: 13 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const e of employees) {
    sheet.addRow({
      id: e.id,
      name: e.name,
      role: e.role,
      department: e.department,
      email: e.email,
      phone: e.phone,
      city: e.city,
      employmentType: e.employmentType,
      status: e.status,
      team: e.teamId ? teamMap.get(e.teamId)?.name ?? "" : "",
      hireDate: e.hireDate.slice(0, 10),
      weeklyHours: e.weeklyHours,
      performanceScore: e.performanceScore,
      permission: e.permission,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="opsynq-employees-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
