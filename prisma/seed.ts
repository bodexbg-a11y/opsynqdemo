import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateStore } from "../lib/data/generate";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The seed data uses our strict domain interfaces (Client, Project, …), but Prisma's
// generated `createMany` input types want its own recursive Json type for jsonb columns
// (milestones, contacts, activity, …). The shapes match at runtime field-for-field; this
// cast just satisfies the structural check without hand-duplicating every input type.
function asInput<T>(rows: unknown[]): T[] {
  return rows as T[];
}

async function main() {
  // Safe to run on every deploy: only seeds an empty database. Real demo activity
  // (projects created/edited/deleted through the app) is never touched or wiped —
  // pass FORCE_SEED=true to explicitly reset back to the deterministic demo dataset.
  const existingCount = await prisma.project.count();
  if (existingCount > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`Database already has ${existingCount} projects — skipping seed. Set FORCE_SEED=true to reset.`);
    return;
  }

  const store = generateStore(1337);

  console.log("Clearing existing data…");
  await prisma.$transaction([
    prisma.task.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.documentItem.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.adCampaign.deleteMany(),
    prisma.appNotification.deleteMany(),
    prisma.equipment.deleteMany(),
    prisma.material.deleteMany(),
    prisma.subcontractor.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.team.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.project.deleteMany(),
    prisma.client.deleteMany(),
  ]);

  console.log(`Seeding ${store.clients.length} clients…`);
  await prisma.client.createMany({ data: asInput<Prisma.ClientCreateManyInput>(store.clients) });

  console.log(`Seeding ${store.employees.length} employees…`);
  await prisma.employee.createMany({ data: asInput<Prisma.EmployeeCreateManyInput>(store.employees) });

  console.log(`Seeding ${store.teams.length} teams…`);
  await prisma.team.createMany({ data: asInput<Prisma.TeamCreateManyInput>(store.teams) });

  console.log(`Seeding ${store.projects.length} projects…`);
  await prisma.project.createMany({ data: asInput<Prisma.ProjectCreateManyInput>(store.projects) });

  console.log(`Seeding ${store.tasks.length} tasks…`);
  await prisma.task.createMany({ data: asInput<Prisma.TaskCreateManyInput>(store.tasks) });

  console.log(`Seeding ${store.invoices.length} invoices…`);
  await prisma.invoice.createMany({ data: asInput<Prisma.InvoiceCreateManyInput>(store.invoices) });

  console.log(`Seeding ${store.contracts.length} contracts…`);
  await prisma.contract.createMany({ data: asInput<Prisma.ContractCreateManyInput>(store.contracts) });

  console.log(`Seeding ${store.subcontractors.length} subcontractors…`);
  await prisma.subcontractor.createMany({ data: asInput<Prisma.SubcontractorCreateManyInput>(store.subcontractors) });

  console.log(`Seeding ${store.suppliers.length} suppliers…`);
  await prisma.supplier.createMany({ data: asInput<Prisma.SupplierCreateManyInput>(store.suppliers) });

  console.log(`Seeding ${store.equipment.length} equipment…`);
  await prisma.equipment.createMany({ data: asInput<Prisma.EquipmentCreateManyInput>(store.equipment) });

  console.log(`Seeding ${store.materials.length} materials…`);
  await prisma.material.createMany({ data: asInput<Prisma.MaterialCreateManyInput>(store.materials) });

  console.log(`Seeding ${store.purchaseOrders.length} purchase orders…`);
  await prisma.purchaseOrder.createMany({ data: asInput<Prisma.PurchaseOrderCreateManyInput>(store.purchaseOrders) });

  console.log(`Seeding ${store.documents.length} documents…`);
  await prisma.documentItem.createMany({ data: asInput<Prisma.DocumentItemCreateManyInput>(store.documents) });

  console.log(`Seeding ${store.notifications.length} notifications…`);
  await prisma.appNotification.createMany({ data: asInput<Prisma.AppNotificationCreateManyInput>(store.notifications) });

  console.log(`Seeding ${store.adCampaigns.length} ad campaigns…`);
  await prisma.adCampaign.createMany({ data: asInput<Prisma.AdCampaignCreateManyInput>(store.adCampaigns) });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
