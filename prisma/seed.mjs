import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { CapexOpex, DepreciationMethod, PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const permissions = [
  "settings.manage",
  "users.manage",
  "roles.manage",
  "permissions.manage",
  "assets.view",
  "assets.manage",
  "movements.manage",
  "disposals.manage",
  "audits.manage",
  "maintenance.manage",
  "reports.view",
  "approvals.manage",
];

const rolePermissions = {
  "super-admin": permissions,
  "asset-manager": [
    "assets.view",
    "assets.manage",
    "movements.manage",
    "disposals.manage",
    "maintenance.manage",
    "audits.manage",
    "reports.view",
    "approvals.manage",
  ],
  auditor: ["assets.view", "audits.manage", "reports.view"],
  maintenance: ["assets.view", "maintenance.manage", "movements.manage", "reports.view"],
  viewer: ["assets.view", "reports.view"],
};

async function upsertPermission(name) {
  return prisma.permission.upsert({
    where: { name_guardName: { name, guardName: "web" } },
    update: {},
    create: { name, guardName: "web" },
  });
}

async function upsertRole(name) {
  return prisma.role.upsert({
    where: { name_guardName: { name, guardName: "web" } },
    update: {},
    create: { name, guardName: "web" },
  });
}

async function seedRbac() {
  const permissionRecords = new Map();

  for (const permission of permissions) {
    permissionRecords.set(permission, await upsertPermission(permission));
  }

  for (const [roleName, assignedPermissions] of Object.entries(rolePermissions)) {
    const role = await upsertRole(roleName);

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    await prisma.rolePermission.createMany({
      data: assignedPermissions.map((permissionName) => ({
        roleId: role.id,
        permissionId: permissionRecords.get(permissionName).id,
      })),
      skipDuplicates: true,
    });
  }
}

async function upsertByFirst(model, where, create, update = {}) {
  const record = await model.findFirst({ where });

  if (record) {
    return model.update({
      where: { id: record.id },
      data: update,
    });
  }

  return model.create({ data: create });
}

async function seedAdmin() {
  const superAdmin = await prisma.role.findUniqueOrThrow({
    where: { name_guardName: { name: "super-admin", guardName: "web" } },
  });
  const password = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "Administrator",
      password,
    },
    create: {
      name: "Administrator",
      email: "admin@example.com",
      password,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdmin.id },
  });
}

async function seedMasterData() {
  const activeStatus = await prisma.assetStatus.upsert({
    where: { code: "ACTIVE" },
    update: {},
    create: { name: "Aktif", code: "ACTIVE", description: "Aset siap digunakan" },
  });

  await prisma.assetStatus.upsert({
    where: { code: "MAINT" },
    update: {},
    create: { name: "Maintenance", code: "MAINT", description: "Dalam perawatan" },
  });

  await prisma.assetStatus.upsert({
    where: { code: "BROKEN" },
    update: {},
    create: { name: "Rusak", code: "BROKEN", description: "Butuh perbaikan/hasil inspeksi" },
  });

  const assetClass = await prisma.assetClass.upsert({
    where: { code: "ELEC" },
    update: {},
    create: { name: "Elektronik", code: "ELEC", description: "Laptop, server, dan perangkat elektronik" },
  });

  await prisma.assetClass.upsert({
    where: { code: "FURN" },
    update: {},
    create: { name: "Furniture", code: "FURN", description: "Meja, kursi, dan lemari" },
  });

  const unit = await prisma.unit.upsert({
    where: { symbol: "pcs" },
    update: {},
    create: { name: "Pieces", symbol: "pcs", description: "Satuan unit umum" },
  });

  await prisma.unit.upsert({
    where: { symbol: "kg" },
    update: {},
    create: { name: "Kilogram", symbol: "kg", description: "Satuan berat" },
  });

  const itDepartment = await prisma.department.upsert({
    where: { code: "IT" },
    update: {},
    create: { name: "IT", code: "IT", description: "Departemen Teknologi" },
  });

  await prisma.department.upsert({
    where: { code: "FIN" },
    update: {},
    create: { name: "Keuangan", code: "FIN", description: "Departemen Finance" },
  });

  const pic = await upsertByFirst(
    prisma.personInCharge,
    { email: "andi@example.com" },
    {
      name: "Andi Saputra",
      email: "andi@example.com",
      phone: "08123456789",
      notes: "Supervisor IT",
    },
  );

  const assetUser = await upsertByFirst(
    prisma.assetUser,
    { email: "budi@example.com" },
    {
      name: "Budi Santoso",
      email: "budi@example.com",
      phone: "0811111111",
      departmentId: itDepartment.id,
      notes: "Pengguna laptop",
    },
    { departmentId: itDepartment.id },
  );

  const officeCategory = await prisma.assetCategory.upsert({
    where: { code: "OFFICE" },
    update: {},
    create: {
      name: "Peralatan Kantor",
      code: "OFFICE",
      description: "Kategori umum peralatan kantor",
    },
  });

  const laptopCategory = await prisma.assetCategory.upsert({
    where: { code: "LAPTOP" },
    update: { parentId: officeCategory.id },
    create: {
      name: "Laptop",
      code: "LAPTOP",
      description: "Perangkat laptop",
      parentId: officeCategory.id,
    },
  });

  const warehouse = await prisma.assetLocation.upsert({
    where: { code: "WH-01" },
    update: {},
    create: { name: "Gudang Pusat", code: "WH-01", description: "Gudang utama" },
  });

  const floor = await prisma.assetLocation.upsert({
    where: { code: "FL-02" },
    update: { parentId: warehouse.id },
    create: { name: "Lantai 2", code: "FL-02", description: "Area kantor lantai 2", parentId: warehouse.id },
  });

  const warranty = await upsertByFirst(
    prisma.warranty,
    { name: "Garansi 1 Tahun" },
    { name: "Garansi 1 Tahun", durationMonths: 12, notes: "Vendor default" },
  );

  await upsertByFirst(
    prisma.warranty,
    { name: "Garansi 3 Tahun" },
    { name: "Garansi 3 Tahun", durationMonths: 36, notes: "Perangkat premium" },
  );

  const vendorContract = await upsertByFirst(
    prisma.vendorContract,
    { contractNumber: "VC-IT-001" },
    {
      vendorName: "PT Vendor Teknologi",
      contractNumber: "VC-IT-001",
      slaResponseHours: 8,
      slaResolutionHours: 48,
      notes: "Kontrak dummy untuk seed awal",
    },
  );

  await prisma.asset.upsert({
    where: { code: "AST-0001" },
    update: {},
    create: {
      code: "AST-0001",
      name: "Laptop Operasional",
      serialNumber: "SN-SEED-0001",
      description: "Aset dummy untuk verifikasi relasi awal",
      assetStatusId: activeStatus.id,
      assetClassId: assetClass.id,
      assetCategoryId: laptopCategory.id,
      unitId: unit.id,
      departmentId: itDepartment.id,
      personInChargeId: pic.id,
      assetUserId: assetUser.id,
      assetLocationId: floor.id,
      warrantyId: warranty.id,
      vendorContractId: vendorContract.id,
      cost: "15000000.00",
      residualValue: "2500000.00",
      depreciationMethod: DepreciationMethod.STRAIGHT_LINE,
      usefulLifeMonths: 36,
      capexOpex: CapexOpex.CAPEX,
      qrToken: "seed-asset-0001",
      metadata: { source: "seed", phase: "stage-2" },
    },
  });
}

async function main() {
  await seedRbac();
  await seedAdmin();
  await seedMasterData();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
