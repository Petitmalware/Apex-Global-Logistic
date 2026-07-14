import {
  EmailTemplateCategory,
  EmailTemplateStatus,
  PermissionAction,
  PrismaClient,
  RoleScope,
  UserStatus,
} from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "ApexDemo12345";
const PASSWORD_ALGORITHM = "pbkdf2_sha256";
const PASSWORD_HASH_BYTES = 32;
const PASSWORD_ITERATIONS = 310_000;
const PASSWORD_SALT_BYTES = 16;

const permissions = [
  ["users:read", "users", PermissionAction.READ],
  ["users:create", "users", PermissionAction.CREATE],
  ["users:update", "users", PermissionAction.UPDATE],
  ["users:manage", "users", PermissionAction.MANAGE],
  ["roles:read", "roles", PermissionAction.READ],
  ["roles:manage", "roles", PermissionAction.MANAGE],
  ["shipments:create", "shipments", PermissionAction.CREATE],
  ["shipments:read", "shipments", PermissionAction.READ],
  ["shipments:update", "shipments", PermissionAction.UPDATE],
  ["shipments:assign", "shipments", PermissionAction.ASSIGN],
  ["shipments:manage", "shipments", PermissionAction.MANAGE],
  ["tracking:create", "tracking", PermissionAction.CREATE],
  ["tracking:read", "tracking", PermissionAction.READ],
  ["tracking:update", "tracking", PermissionAction.UPDATE],
  ["packages:read", "packages", PermissionAction.READ],
  ["packages:update", "packages", PermissionAction.UPDATE],
  ["pet_transport:create", "pet_transport", PermissionAction.CREATE],
  ["pet_transport:read", "pet_transport", PermissionAction.READ],
  ["pet_transport:update", "pet_transport", PermissionAction.UPDATE],
  ["pet_transport:manage", "pet_transport", PermissionAction.MANAGE],
  ["freight_transport:create", "freight_transport", PermissionAction.CREATE],
  ["freight_transport:read", "freight_transport", PermissionAction.READ],
  ["freight_transport:update", "freight_transport", PermissionAction.UPDATE],
  ["freight_transport:manage", "freight_transport", PermissionAction.MANAGE],
  ["warehouses:read", "warehouses", PermissionAction.READ],
  ["warehouses:manage", "warehouses", PermissionAction.MANAGE],
  ["drivers:read", "drivers", PermissionAction.READ],
  ["drivers:manage", "drivers", PermissionAction.MANAGE],
  ["vehicles:read", "vehicles", PermissionAction.READ],
  ["vehicles:manage", "vehicles", PermissionAction.MANAGE],
  ["invoices:read", "invoices", PermissionAction.READ],
  ["invoices:create", "invoices", PermissionAction.CREATE],
  ["invoices:update", "invoices", PermissionAction.UPDATE],
  ["invoices:manage", "invoices", PermissionAction.MANAGE],
  ["notifications:read", "notifications", PermissionAction.READ],
  ["notifications:create", "notifications", PermissionAction.CREATE],
  ["notifications:manage", "notifications", PermissionAction.MANAGE],
  ["emails:read", "emails", PermissionAction.READ],
  ["emails:create", "emails", PermissionAction.CREATE],
  ["emails:manage", "emails", PermissionAction.MANAGE],
  ["support:create", "support", PermissionAction.CREATE],
  ["support:read", "support", PermissionAction.READ],
  ["support:update", "support", PermissionAction.UPDATE],
  ["support:manage", "support", PermissionAction.MANAGE],
  ["ai:create", "ai", PermissionAction.CREATE],
  ["ai:read", "ai", PermissionAction.READ],
  ["settings:read", "settings", PermissionAction.READ],
  ["settings:manage", "settings", PermissionAction.MANAGE],
  ["audit:read", "audit", PermissionAction.READ],
  ["audit:export", "audit", PermissionAction.EXPORT],
];

const roleDefinitions = [
  {
    key: "customer",
    name: "Customer",
    description:
      "Customer portal access for assigned shipments, tracking, invoices, notifications, and support.",
    permissionKeys: [
      "shipments:read",
      "tracking:read",
      "packages:read",
      "pet_transport:read",
      "freight_transport:read",
      "invoices:read",
      "notifications:read",
      "support:create",
      "support:read",
    ],
  },
  {
    key: "agent",
    name: "Agent",
    description: "Operations access for shipment handling, tracking, packages, and assignments.",
    permissionKeys: [
      "shipments:read",
      "shipments:update",
      "shipments:assign",
      "tracking:create",
      "tracking:read",
      "tracking:update",
      "packages:read",
      "packages:update",
      "pet_transport:read",
      "pet_transport:update",
      "freight_transport:read",
      "freight_transport:update",
      "warehouses:read",
      "drivers:read",
      "vehicles:read",
      "support:read",
      "support:update",
      "ai:create",
      "ai:read",
    ],
  },
  {
    key: "support",
    name: "Support",
    description: "Support access for customer help, shipment visibility, and notifications.",
    permissionKeys: [
      "users:read",
      "shipments:read",
      "tracking:read",
      "packages:read",
      "pet_transport:read",
      "pet_transport:update",
      "freight_transport:read",
      "freight_transport:update",
      "invoices:read",
      "notifications:create",
      "emails:read",
      "emails:create",
      "support:create",
      "support:read",
      "support:update",
      "support:manage",
      "ai:create",
      "ai:read",
    ],
  },
  {
    key: "admin",
    name: "Admin",
    description: "Organization administration for operations, billing, staff, and settings.",
    permissionKeys: [
      "users:read",
      "users:create",
      "users:update",
      "roles:read",
      "shipments:manage",
      "tracking:create",
      "tracking:read",
      "tracking:update",
      "packages:read",
      "packages:update",
      "pet_transport:manage",
      "freight_transport:manage",
      "warehouses:manage",
      "drivers:manage",
      "vehicles:manage",
      "invoices:manage",
      "notifications:manage",
      "emails:read",
      "emails:create",
      "emails:manage",
      "support:manage",
      "settings:read",
      "settings:manage",
      "audit:read",
      "ai:create",
      "ai:read",
    ],
  },
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Platform-wide access across all organizations and administrative systems.",
    permissionKeys: permissions.map(([key]) => key),
  },
];

const templateVariables = [
  "customerName",
  "trackingNumber",
  "shipmentStatus",
  "currentLocation",
  "estimatedDeliveryDate",
  "petName",
  "companyName",
  "supportEmail",
  "supportPhone",
  "invoiceNumber",
  "amountDue",
];

const emailTemplates = [
  {
    category: EmailTemplateCategory.SHIPMENT,
    key: "shipment-created",
    name: "Shipment Created",
    subject: "Shipment {{trackingNumber}} has been created",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your shipment has been created and is ready for the next handoff.</p>",
  },
  {
    category: EmailTemplateCategory.PAYMENT,
    key: "payment-confirmed",
    name: "Payment Confirmed",
    subject: "Payment confirmed for {{invoiceNumber}}",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>We have confirmed your payment of {{amountDue}} for invoice {{invoiceNumber}}.</p>",
  },
  {
    category: EmailTemplateCategory.PACKAGE,
    key: "package-received",
    name: "Package Received",
    subject: "Package received for {{trackingNumber}}",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your package has been received at {{currentLocation}} and logged into our network.</p>",
  },
  {
    category: EmailTemplateCategory.SHIPMENT,
    key: "shipment-in-transit",
    name: "Shipment In Transit",
    subject: "Shipment {{trackingNumber}} is in transit",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your shipment is now in transit. Current status: {{shipmentStatus}}.</p>",
  },
  {
    category: EmailTemplateCategory.SHIPMENT,
    key: "customs-hold",
    name: "Customs Hold",
    subject: "Action may be required for {{trackingNumber}}",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your shipment is currently under customs review at {{currentLocation}}. Our team is monitoring the clearance.</p>",
  },
  {
    category: EmailTemplateCategory.SHIPMENT,
    key: "shipment-delayed",
    name: "Shipment Delayed",
    subject: "Shipment {{trackingNumber}} update",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your shipment has experienced a delay. Estimated delivery is now {{estimatedDeliveryDate}}.</p>",
  },
  {
    category: EmailTemplateCategory.SHIPMENT,
    key: "out-for-delivery",
    name: "Out For Delivery",
    subject: "Shipment {{trackingNumber}} is out for delivery",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your shipment is out for delivery and expected by {{estimatedDeliveryDate}}.</p>",
  },
  {
    category: EmailTemplateCategory.SHIPMENT,
    key: "delivered",
    name: "Delivered",
    subject: "Shipment {{trackingNumber}} has been delivered",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your shipment has been delivered. Thank you for shipping with {{companyName}}.</p>",
  },
  {
    category: EmailTemplateCategory.PET,
    key: "pet-registration",
    name: "Pet Registration",
    subject: "{{petName}} is registered for transport",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>{{petName}} has been registered for pet transportation with {{companyName}}.</p>",
  },
  {
    category: EmailTemplateCategory.PET,
    key: "pet-health-check-completed",
    name: "Pet Health Check Completed",
    subject: "{{petName}} health check completed",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>{{petName}} has completed the required health check and remains cleared for travel.</p>",
  },
  {
    category: EmailTemplateCategory.PET,
    key: "pet-travel-update",
    name: "Pet Travel Update",
    subject: "Travel update for {{petName}}",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>{{petName}} has a new travel update: {{shipmentStatus}} at {{currentLocation}}.</p>",
  },
  {
    category: EmailTemplateCategory.PET,
    key: "pet-delivered",
    name: "Pet Delivered",
    subject: "{{petName}} has arrived",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>{{petName}} has been delivered safely. Thank you for trusting {{companyName}}.</p>",
  },
  {
    category: EmailTemplateCategory.FREIGHT,
    key: "freight-quote-created",
    name: "Freight Quote Created",
    subject: "Freight quote created for {{trackingNumber}}",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your freight quote has been created and is ready for review.</p>",
  },
  {
    category: EmailTemplateCategory.FREIGHT,
    key: "freight-driver-assigned",
    name: "Freight Driver Assigned",
    subject: "Driver assigned for {{trackingNumber}}",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>A freight driver has been assigned to your shipment.</p>",
  },
  {
    category: EmailTemplateCategory.FREIGHT,
    key: "freight-delivered",
    name: "Freight Delivered",
    subject: "Freight shipment {{trackingNumber}} delivered",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Your freight shipment has been delivered successfully.</p>",
  },
  {
    category: EmailTemplateCategory.INVOICE,
    key: "invoice-sent",
    name: "Invoice Sent",
    subject: "Invoice {{invoiceNumber}} from {{companyName}}",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Invoice {{invoiceNumber}} for {{amountDue}} is ready for review.</p>",
  },
  {
    category: EmailTemplateCategory.AUTH,
    key: "password-reset",
    name: "Password Reset",
    subject: "Reset your {{companyName}} password",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>Use the secure link below to reset your password. If you did not request this, contact support.</p>",
  },
  {
    category: EmailTemplateCategory.ADMIN,
    key: "admin-announcement",
    name: "Admin Announcement",
    subject: "Important update from {{companyName}}",
    bodyHtml:
      "<p>Hello {{customerName}},</p><p>We have an important update from the {{companyName}} team.</p>",
  },
  {
    category: EmailTemplateCategory.MANUAL,
    key: "custom-manual-email",
    name: "Custom Manual Email",
    subject: "{{companyName}} update",
    bodyHtml: "<p>Hello {{customerName}},</p><p>Write your message here.</p>",
  },
];

const demoUsers = [
  {
    email: "admin@apexgloballogistics.test",
    name: "Apex Admin",
    roleKey: "admin",
  },
  {
    email: "customer@apexgloballogistics.test",
    name: "Apex Customer",
    roleKey: "customer",
  },
  {
    email: "superadmin@apexgloballogistics.test",
    name: "Apex Super Admin",
    roleKey: "super_admin",
  },
];

const retiredDemoUserEmails = [
  "admin@apexgloballogistics.test",
  "customer@apexgloballogistics.test",
  "superadmin@apexgloballogistics.test",
  "agent@apexgloballogistics.test",
  "support@apexgloballogistics.test",
];

function shouldSeedDemoUsers() {
  return process.env.SEED_DEMO_USERS === "true";
}

function getSeedAdminConfig() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return {
    email,
    name: process.env.SEED_ADMIN_NAME?.trim() || "Apex Admin",
    password,
  };
}

function hashPassword(password) {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_HASH_BYTES, "sha256");

  return [
    PASSWORD_ALGORITHM,
    PASSWORD_ITERATIONS.toString(),
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

async function upsertPermissions() {
  for (const [key, resource, action] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: {
        action,
        resource,
      },
      create: {
        action,
        key,
        resource,
      },
    });
  }
}

async function upsertSystemRole(definition) {
  const existingRole = await prisma.role.findFirst({
    where: {
      key: definition.key,
      organizationId: null,
    },
  });

  const role =
    existingRole ??
    (await prisma.role.create({
      data: {
        description: definition.description,
        isSystem: true,
        key: definition.key,
        name: definition.name,
        scope: RoleScope.GLOBAL,
      },
    }));

  await prisma.role.update({
    where: { id: role.id },
    data: {
      description: definition.description,
      isSystem: true,
      name: definition.name,
      scope: RoleScope.GLOBAL,
    },
  });

  const rolePermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: definition.permissionKeys,
      },
    },
    select: {
      id: true,
    },
  });

  const permissionIdsToKeep = rolePermissions.map((permission) => permission.id);

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: role.id,
      permissionId: {
        notIn: permissionIdsToKeep,
      },
    },
  });

  await prisma.rolePermission.createMany({
    data: rolePermissions.map((permission) => ({
      permissionId: permission.id,
      roleId: role.id,
    })),
    skipDuplicates: true,
  });
}

async function archiveRetiredDemoUsers() {
  await prisma.user.updateMany({
    data: {
      deletedAt: new Date(),
      status: UserStatus.ARCHIVED,
    },
    where: {
      email: {
        in: retiredDemoUserEmails,
      },
    },
  });
}

async function upsertProductionAdmin() {
  const adminConfig = getSeedAdminConfig();

  if (!adminConfig) {
    return null;
  }

  const organization = await upsertDemoOrganization();
  const adminRole = await prisma.role.findFirst({
    select: {
      id: true,
    },
    where: {
      key: "admin",
      organizationId: null,
    },
  });

  if (!adminRole) {
    throw new Error("Seed admin role not found.");
  }

  const user = await prisma.user.upsert({
    create: {
      email: adminConfig.email,
      emailVerifiedAt: new Date(),
      hashedPassword: hashPassword(adminConfig.password),
      name: adminConfig.name,
      organizationId: organization.id,
      status: UserStatus.ACTIVE,
    },
    update: {
      emailVerifiedAt: new Date(),
      hashedPassword: hashPassword(adminConfig.password),
      name: adminConfig.name,
      organizationId: organization.id,
      status: UserStatus.ACTIVE,
    },
    where: {
      email: adminConfig.email,
    },
  });

  await assignDemoRole({
    organizationId: organization.id,
    roleId: adminRole.id,
    userId: user.id,
  });

  return user;
}

async function upsertEmailTemplate(template) {
  const slug = template.key;
  const existingTemplate = await prisma.emailTemplate.findFirst({
    where: {
      key: template.key,
      locale: "en",
      organizationId: null,
      version: 1,
    },
  });

  const data = {
    bodyHtml: template.bodyHtml,
    bodyText: template.bodyHtml
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    category: template.category,
    isActive: true,
    name: template.name,
    slug,
    status: EmailTemplateStatus.ACTIVE,
    subject: template.subject,
    variables: templateVariables,
  };

  if (existingTemplate) {
    await prisma.emailTemplate.update({
      data,
      where: {
        id: existingTemplate.id,
      },
    });
    return;
  }

  await prisma.emailTemplate.create({
    data: {
      ...data,
      key: template.key,
      locale: "en",
      version: 1,
    },
  });
}

async function upsertDemoOrganization() {
  return prisma.organization.upsert({
    create: {
      email: "ops@apexgloballogistics.test",
      name: "Apex Global Logistics Demo",
      slug: "apex-demo",
    },
    update: {
      email: "ops@apexgloballogistics.test",
      name: "Apex Global Logistics Demo",
    },
    where: {
      slug: "apex-demo",
    },
  });
}

async function assignDemoRole({ organizationId, roleId, userId }) {
  const existingRole = await prisma.userRole.findFirst({
    where: {
      organizationId,
      roleId,
      userId,
      warehouseId: null,
    },
  });

  if (existingRole) {
    return;
  }

  await prisma.userRole.create({
    data: {
      organizationId,
      roleId,
      userId,
    },
  });
}

async function upsertDemoUsers() {
  const organization = await upsertDemoOrganization();
  const roleKeys = demoUsers.map((user) => user.roleKey);
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      key: true,
    },
    where: {
      key: {
        in: roleKeys,
      },
      organizationId: null,
    },
  });
  const rolesByKey = new Map(roles.map((role) => [role.key, role]));

  for (const demoUser of demoUsers) {
    const role = rolesByKey.get(demoUser.roleKey);

    if (!role) {
      throw new Error(`Seed role not found: ${demoUser.roleKey}`);
    }

    const user = await prisma.user.upsert({
      create: {
        email: demoUser.email,
        emailVerifiedAt: new Date(),
        hashedPassword: hashPassword(DEMO_PASSWORD),
        name: demoUser.name,
        organizationId: organization.id,
        status: UserStatus.ACTIVE,
      },
      update: {
        emailVerifiedAt: new Date(),
        hashedPassword: hashPassword(DEMO_PASSWORD),
        name: demoUser.name,
        organizationId: organization.id,
        status: UserStatus.ACTIVE,
      },
      where: {
        email: demoUser.email,
      },
    });

    await assignDemoRole({
      organizationId: organization.id,
      roleId: role.id,
      userId: user.id,
    });
  }
}

async function main() {
  await upsertPermissions();

  for (const definition of roleDefinitions) {
    await upsertSystemRole(definition);
  }

  for (const template of emailTemplates) {
    await upsertEmailTemplate(template);
  }

  const productionAdmin = await upsertProductionAdmin();

  if (shouldSeedDemoUsers()) {
    await upsertDemoUsers();
    console.info(`Seeded demo login password: ${DEMO_PASSWORD}`);
  } else {
    await archiveRetiredDemoUsers();
    console.info("Demo login users archived. Set SEED_DEMO_USERS=true to recreate them.");
  }

  if (productionAdmin) {
    console.info(`Production admin ready: ${productionAdmin.email}`);
  }
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
