import "server-only";

import { UserStatus } from "@prisma/client";

import { AUTH_ROLES } from "@/lib/auth/constants";
import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type { CustomerOption } from "@/features/shipments/types";
import { prisma } from "@/lib/db";

export async function getCustomerOptionsForStaff(user: AuthSessionUser): Promise<CustomerOption[]> {
  const canAssignCustomer =
    user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);

  if (!canAssignCustomer) {
    return [];
  }

  try {
    const customers = await prisma.user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        email: true,
        emailVerifiedAt: true,
        id: true,
        name: true,
        status: true,
      },
      take: 200,
      where: {
        deletedAt: null,
        status: {
          in: [UserStatus.ACTIVE, UserStatus.INVITED],
        },
        userRoles: {
          some: {
            role: {
              key: AUTH_ROLES.CUSTOMER,
              organizationId: null,
            },
          },
        },
      },
    });

    return customers.map((customer) => ({
      email: customer.email,
      id: customer.id,
      label: `${customer.name} <${customer.email}>${
        customer.emailVerifiedAt ? "" : " - pending verification"
      }`,
      name: customer.name,
    }));
  } catch (error) {
    if (process.env.APP_ENV === "development") {
      console.warn("Unable to load customer options", {
        message: error instanceof Error ? error.message : "Unknown customer query error",
        name: error instanceof Error ? error.name : typeof error,
      });
    }

    return [];
  }
}
