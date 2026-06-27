import "server-only";
import { unstable_cache } from "next/cache";
import {
  FreightTransportStatus,
  InvoiceStatus,
  type Invoice,
  type Prisma,
  ShipmentStatus,
} from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import { generateAiText } from "@/features/ai/services/ai-provider.service";
import { recordAiInteraction } from "@/features/ai/services/ai-audit.service";
import type {
  AnalyticsDashboardData,
  AnalyticsInsight,
  AnalyticsMetric,
  AnalyticsTrendPoint,
} from "@/features/analytics/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.BOOKED,
  ShipmentStatus.PENDING_PICKUP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.HELD,
];
const EXCEPTION_SHIPMENT_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.CANCELLED,
  ShipmentStatus.HELD,
  ShipmentStatus.RETURNED,
];
const CLOSED_FREIGHT_STATUSES: FreightTransportStatus[] = [
  FreightTransportStatus.CANCELLED,
  FreightTransportStatus.DELIVERED,
];

function getOrganizationScope(user: AuthSessionUser) {
  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return {};
  }

  return {
    organizationId: user.organizationId ?? EMPTY_UUID,
  };
}

function getMonthWindows(count = 6) {
  const now = new Date();
  const startOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return Array.from({ length: count }, (_, index) => {
    const monthOffset = count - index - 1;
    const start = new Date(
      Date.UTC(
        startOfCurrentMonth.getUTCFullYear(),
        startOfCurrentMonth.getUTCMonth() - monthOffset,
        1,
      ),
    );
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

    return {
      end,
      label: start.toLocaleString("en", { month: "short" }),
      start,
    };
  });
}

function toNumber(value: unknown) {
  if (!value) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value) || 0;
  }

  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }

  return Number(value) || 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1000000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDelta(current: number, previous: number, suffix = "%") {
  if (!previous) {
    return current > 0 ? `+100${suffix}` : `0${suffix}`;
  }

  const delta = ((current - previous) / previous) * 100;
  const sign = delta > 0 ? "+" : "";

  return `${sign}${Math.round(delta)}${suffix}`;
}

function buildTrend<T>(
  windows: ReturnType<typeof getMonthWindows>,
  records: T[],
  getDate: (record: T) => Date,
  getValue: (record: T) => number,
): AnalyticsTrendPoint[] {
  return windows.map((window) => ({
    label: window.label,
    value: records
      .filter((record) => {
        const date = getDate(record);

        return date >= window.start && date < window.end;
      })
      .reduce((total, record) => total + getValue(record), 0),
  }));
}

function getLastValue(trend: AnalyticsTrendPoint[]) {
  return trend[trend.length - 1]?.value ?? 0;
}

function getPreviousValue(trend: AnalyticsTrendPoint[]) {
  return trend[trend.length - 2]?.value ?? 0;
}

function countBy<T>(records: T[], getLabel: (record: T) => string | null | undefined) {
  const counts = new Map<string, number>();

  for (const record of records) {
    const label = getLabel(record) ?? "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

function calculateOnTimeRate(
  records: Array<{ deliveredAt: Date | null; deliveryWindowEnd: Date | null }>,
) {
  const eligible = records.filter((record) => record.deliveredAt && record.deliveryWindowEnd);

  if (!eligible.length) {
    return 0;
  }

  const onTime = eligible.filter(
    (record) =>
      record.deliveredAt &&
      record.deliveryWindowEnd &&
      record.deliveredAt <= record.deliveryWindowEnd,
  ).length;

  return (onTime / eligible.length) * 100;
}

function calculateAverageTransitHours(
  records: Array<{ deliveredAt: Date | null; dispatchedAt: Date | null }>,
) {
  const transitHours = records
    .filter((record) => record.deliveredAt && record.dispatchedAt)
    .map((record) => {
      const deliveredAt = record.deliveredAt?.getTime() ?? 0;
      const dispatchedAt = record.dispatchedAt?.getTime() ?? 0;

      return (deliveredAt - dispatchedAt) / 36e5;
    })
    .filter((hours) => hours >= 0);

  if (!transitHours.length) {
    return 0;
  }

  return transitHours.reduce((total, hours) => total + hours, 0) / transitHours.length;
}

function getInvoiceValue(invoice: Pick<Invoice, "amountPaid" | "total">) {
  const paid = toNumber(invoice.amountPaid);

  return paid > 0 ? paid : toNumber(invoice.total);
}

function buildFallbackInsights(data: {
  delayedShipments: number;
  onTimeRate: number;
  outstandingRevenue: number;
  revenue: number;
  utilizationRate: number;
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [
    {
      body:
        data.onTimeRate >= 90
          ? "Delivery performance is holding above target. Keep attention on exception queues so the high service level does not erode."
          : "Delivery performance needs attention. Review delayed shipments and assign owners to missed delivery windows.",
      title: "Delivery health",
      tone: data.onTimeRate >= 90 ? "success" : "warning",
    },
    {
      body:
        data.outstandingRevenue > data.revenue * 0.25
          ? "Outstanding revenue is material versus collected revenue. Finance should prioritize invoice follow-up."
          : "Revenue collection looks balanced against the current invoice base.",
      title: "Revenue collection",
      tone: data.outstandingRevenue > data.revenue * 0.25 ? "warning" : "success",
    },
    {
      body:
        data.utilizationRate > 85
          ? "Warehouse load is high. Consider balancing new pickups across less loaded hubs."
          : "Warehouse load leaves room for additional dispatch volume.",
      title: "Network capacity",
      tone: data.utilizationRate > 85 ? "warning" : "info",
    },
  ];

  if (data.delayedShipments > 0) {
    insights.push({
      body: `${data.delayedShipments} shipments have schedule risk. Customer-facing updates should be prepared before escalation volume rises.`,
      title: "Exception prevention",
      tone: "danger",
    });
  }

  return insights.slice(0, 4);
}

function parseAiInsights(text: string, fallback: AnalyticsInsight[]) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.:\s]+/, "").trim())
    .filter((line) => line.length > 12)
    .slice(0, 4);

  if (!lines.length) {
    return fallback;
  }

  return lines.map((line, index) => ({
    body: line,
    title: fallback[index]?.title ?? "AI insight",
    tone: fallback[index]?.tone ?? "info",
  }));
}

async function generateAnalyticsInsights(
  user: AuthSessionUser,
  input: {
    activeShipments: number;
    delayedShipments: number;
    freightActive: number;
    onTimeRate: number;
    outstandingRevenue: number;
    petActive: number;
    revenue: number;
    utilizationRate: number;
  },
) {
  const fallback = buildFallbackInsights({
    delayedShipments: input.delayedShipments,
    onTimeRate: input.onTimeRate,
    outstandingRevenue: input.outstandingRevenue,
    revenue: input.revenue,
    utilizationRate: input.utilizationRate,
  });
  const prompt = [
    "Create four concise executive analytics insights for Apex Global Logistics.",
    "Focus on revenue, delivery performance, capacity, and operational risk.",
    `Paid revenue: ${formatMoney(input.revenue)}`,
    `Outstanding revenue: ${formatMoney(input.outstandingRevenue)}`,
    `Active shipments: ${input.activeShipments}`,
    `Delayed shipments: ${input.delayedShipments}`,
    `On-time delivery rate: ${formatPercent(input.onTimeRate)}`,
    `Active freight transports: ${input.freightActive}`,
    `Active pet transports: ${input.petActive}`,
    `Average warehouse utilization: ${formatPercent(input.utilizationRate)}`,
  ].join("\n");

  try {
    const output = await generateAiText({
      maxTokens: 500,
      messages: [
        {
          content:
            "You are a logistics analytics strategist. Return crisp, board-ready insight bullets. Do not invent numbers.",
          role: "system",
        },
        { content: prompt, role: "user" },
      ],
      task: "analytics-insights",
      temperature: 0.25,
    });

    await recordAiInteraction({
      input: prompt,
      metadata: {
        source: "analytics-dashboard",
      },
      output,
      task: "analytics-insights",
      user,
    });

    return {
      insights: parseAiInsights(output.text, fallback),
      model: output.model,
      provider: output.provider,
    };
  } catch (error) {
    console.error("Analytics AI insight generation failed", error);

    return {
      insights: fallback,
      model: "deterministic-fallback",
      provider: "local",
    };
  }
}

function buildTopMetrics(input: {
  activeShipments: number;
  customerTrend: AnalyticsTrendPoint[];
  deliveryOnTimeRate: number;
  outstandingRevenue: number;
  revenueTrend: AnalyticsTrendPoint[];
  shipmentsTrend: AnalyticsTrendPoint[];
  totalRevenue: number;
}): AnalyticsMetric[] {
  return [
    {
      delta: formatDelta(getLastValue(input.revenueTrend), getPreviousValue(input.revenueTrend)),
      description: `${formatMoney(input.outstandingRevenue)} outstanding across open invoices`,
      label: "Revenue",
      tone: "accent",
      value: formatMoney(input.totalRevenue),
    },
    {
      delta: formatDelta(
        getLastValue(input.shipmentsTrend),
        getPreviousValue(input.shipmentsTrend),
      ),
      description: `${formatNumber(input.activeShipments)} active shipments in motion`,
      label: "Shipments",
      tone: "info",
      value: formatNumber(input.shipmentsTrend.reduce((total, item) => total + item.value, 0)),
    },
    {
      delta: input.deliveryOnTimeRate >= 90 ? "On target" : "Watchlist",
      description: "Delivered shipments with a recorded delivery window",
      label: "Delivery SLA",
      tone: input.deliveryOnTimeRate >= 90 ? "success" : "warning",
      value: formatPercent(input.deliveryOnTimeRate),
    },
    {
      delta: formatDelta(getLastValue(input.customerTrend), getPreviousValue(input.customerTrend)),
      description: "New customer accounts added during the reporting window",
      label: "Customer growth",
      tone: "success",
      value: formatNumber(input.customerTrend.reduce((total, item) => total + item.value, 0)),
    },
  ];
}

async function buildAnalyticsDashboardData(user: AuthSessionUser): Promise<AnalyticsDashboardData> {
  const windows = getMonthWindows();
  const periodStart = windows[0]?.start ?? new Date();
  const organizationScope = getOrganizationScope(user);
  const invoiceWhere: Prisma.InvoiceWhereInput = {
    ...organizationScope,
    createdAt: {
      gte: periodStart,
    },
    deletedAt: null,
  };
  const shipmentWhere: Prisma.ShipmentWhereInput = {
    ...organizationScope,
    createdAt: {
      gte: periodStart,
    },
    deletedAt: null,
  };
  const userWhere: Prisma.UserWhereInput = {
    ...organizationScope,
    createdAt: {
      gte: periodStart,
    },
    deletedAt: null,
    userRoles: {
      some: {
        role: {
          key: AUTH_ROLES.CUSTOMER,
        },
      },
    },
  };
  const freightWhere: Prisma.FreightTransportWhereInput = {
    createdAt: {
      gte: periodStart,
    },
    shipment: {
      ...organizationScope,
      deletedAt: null,
    },
  };
  const petWhere: Prisma.PetTransportWhereInput = {
    createdAt: {
      gte: periodStart,
    },
    shipment: {
      ...organizationScope,
      deletedAt: null,
    },
  };

  const [
    invoices,
    invoiceTotals,
    shipments,
    newCustomers,
    totalCustomers,
    freightTransports,
    petTransports,
    warehouses,
    drivers,
  ] = await Promise.all([
    prisma.invoice.findMany({
      select: {
        amountPaid: true,
        createdAt: true,
        total: true,
      },
      where: invoiceWhere,
    }),
    prisma.invoice.aggregate({
      _sum: {
        amountPaid: true,
        total: true,
      },
      where: {
        ...invoiceWhere,
        status: {
          notIn: [InvoiceStatus.VOID, InvoiceStatus.UNCOLLECTIBLE],
        },
      },
    }),
    prisma.shipment.findMany({
      select: {
        createdAt: true,
        deliveredAt: true,
        deliveryWindowEnd: true,
        dispatchedAt: true,
        mode: true,
        status: true,
      },
      where: shipmentWhere,
    }),
    prisma.user.findMany({
      select: {
        createdAt: true,
      },
      where: userWhere,
    }),
    prisma.user.count({
      where: {
        ...organizationScope,
        deletedAt: null,
        userRoles: {
          some: {
            role: {
              key: AUTH_ROLES.CUSTOMER,
            },
          },
        },
      },
    }),
    prisma.freightTransport.findMany({
      include: {
        cargoItems: {
          select: {
            hazardous: true,
            volumeCbm: true,
            weightKg: true,
          },
        },
        containers: {
          select: {
            id: true,
          },
        },
        documents: {
          select: {
            id: true,
          },
        },
      },
      where: freightWhere,
    }),
    prisma.petTransport.findMany({
      select: {
        createdAt: true,
        species: true,
        status: true,
        vaccinationVerified: true,
        weightKg: true,
      },
      where: petWhere,
    }),
    prisma.warehouse.findMany({
      include: {
        destinationShipments: {
          select: {
            id: true,
          },
          where: {
            deletedAt: null,
            status: {
              in: ACTIVE_SHIPMENT_STATUSES,
            },
          },
        },
        drivers: {
          select: {
            id: true,
          },
          where: {
            deletedAt: null,
          },
        },
        originShipments: {
          select: {
            id: true,
          },
          where: {
            deletedAt: null,
            status: {
              in: ACTIVE_SHIPMENT_STATUSES,
            },
          },
        },
        vehicles: {
          select: {
            id: true,
          },
          where: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
      where: {
        ...organizationScope,
        deletedAt: null,
      },
    }),
    prisma.driver.findMany({
      include: {
        assignedShipments: {
          select: {
            deliveredAt: true,
            deliveryWindowEnd: true,
            status: true,
          },
          where: {
            deletedAt: null,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
      where: {
        ...organizationScope,
        deletedAt: null,
      },
    }),
  ]);

  const revenueTrend = buildTrend(
    windows,
    invoices,
    (invoice) => invoice.createdAt,
    (invoice) => getInvoiceValue(invoice),
  );
  const shipmentTrend = buildTrend(
    windows,
    shipments,
    (shipment) => shipment.createdAt,
    () => 1,
  );
  const customerTrend = buildTrend(
    windows,
    newCustomers,
    (customer) => customer.createdAt,
    () => 1,
  );
  const freightTrend = buildTrend(
    windows,
    freightTransports,
    (freight) => freight.createdAt,
    () => 1,
  );
  const deliveredShipments = shipments.filter(
    (shipment) => shipment.status === ShipmentStatus.DELIVERED,
  );
  const activeShipments = shipments.filter((shipment) =>
    ACTIVE_SHIPMENT_STATUSES.includes(shipment.status),
  ).length;
  const exceptionShipments = shipments.filter((shipment) =>
    EXCEPTION_SHIPMENT_STATUSES.includes(shipment.status),
  ).length;
  const delayedShipments = shipments.filter(
    (shipment) =>
      shipment.status !== ShipmentStatus.DELIVERED &&
      shipment.deliveryWindowEnd &&
      shipment.deliveryWindowEnd < new Date(),
  ).length;
  const totalRevenue = toNumber(invoiceTotals._sum.total);
  const paidRevenue = toNumber(invoiceTotals._sum.amountPaid);
  const outstandingRevenue = Math.max(totalRevenue - paidRevenue, 0);
  const deliveryOnTimeRate = calculateOnTimeRate(deliveredShipments);
  const freightActive = freightTransports.filter(
    (freight) => !CLOSED_FREIGHT_STATUSES.includes(freight.status),
  ).length;
  const freightDelivered = freightTransports.filter(
    (freight) => freight.status === FreightTransportStatus.DELIVERED,
  ).length;
  const freightWeight = freightTransports.reduce(
    (total, freight) =>
      total +
      (toNumber(freight.grossWeightKg) ||
        freight.cargoItems.reduce((cargoTotal, item) => cargoTotal + toNumber(item.weightKg), 0)),
    0,
  );
  const freightVolume = freightTransports.reduce(
    (total, freight) =>
      total +
      (toNumber(freight.volumeCbm) ||
        freight.cargoItems.reduce((cargoTotal, item) => cargoTotal + toNumber(item.volumeCbm), 0)),
    0,
  );
  const freightContainers = freightTransports.reduce(
    (total, freight) => total + freight.containers.length,
    0,
  );
  const freightDocuments = freightTransports.reduce(
    (total, freight) => total + freight.documents.length,
    0,
  );
  const petActive = petTransports.filter((pet) =>
    ["CLEARED", "DOCUMENTATION_PENDING", "IN_TRANSIT", "REQUESTED"].includes(pet.status),
  ).length;
  const petDelivered = petTransports.filter((pet) => pet.status === "DELIVERED").length;
  const petWeights = petTransports
    .map((pet) => toNumber(pet.weightKg))
    .filter((weight) => weight > 0);
  const healthClearanceRate = petTransports.length
    ? (petTransports.filter((pet) => pet.vaccinationVerified).length / petTransports.length) * 100
    : 0;
  const warehouseUtilization = warehouses.map((warehouse) => {
    const activeLoad = warehouse.originShipments.length + warehouse.destinationShipments.length;
    const capacityProxy = Math.max(warehouse.vehicles.length * 6 + warehouse.drivers.length * 2, 1);

    return {
      activeShipments: activeLoad,
      drivers: warehouse.drivers.length,
      name: warehouse.name,
      status: warehouse.status,
      utilizationRate: Math.min(100, (activeLoad / capacityProxy) * 100),
      vehicles: warehouse.vehicles.length,
    };
  });
  const averageWarehouseUtilization = warehouseUtilization.length
    ? warehouseUtilization.reduce((total, warehouse) => total + warehouse.utilizationRate, 0) /
      warehouseUtilization.length
    : 0;
  const driverPerformance = drivers
    .map((driver) => {
      const assignedShipments = driver.assignedShipments.length;
      const delivered = driver.assignedShipments.filter(
        (shipment) => shipment.status === ShipmentStatus.DELIVERED,
      );

      return {
        activeShipments: driver.assignedShipments.filter((shipment) =>
          ACTIVE_SHIPMENT_STATUSES.includes(shipment.status),
        ).length,
        assignedShipments,
        deliveredShipments: delivered.length,
        exceptionShipments: driver.assignedShipments.filter((shipment) =>
          EXCEPTION_SHIPMENT_STATUSES.includes(shipment.status),
        ).length,
        name: driver.user?.name ?? driver.employeeNumber,
        onTimeRate: calculateOnTimeRate(delivered),
        status: driver.status,
      };
    })
    .sort((a, b) => b.deliveredShipments - a.deliveredShipments);
  const aiInsights = await generateAnalyticsInsights(user, {
    activeShipments,
    delayedShipments,
    freightActive,
    onTimeRate: deliveryOnTimeRate,
    outstandingRevenue,
    petActive,
    revenue: paidRevenue,
    utilizationRate: averageWarehouseUtilization,
  });
  const metrics = buildTopMetrics({
    activeShipments,
    customerTrend,
    deliveryOnTimeRate,
    outstandingRevenue,
    revenueTrend,
    shipmentsTrend: shipmentTrend,
    totalRevenue: paidRevenue,
  });

  return {
    aiInsights,
    customerGrowth: {
      newCustomers: newCustomers.length,
      totalCustomers,
      trend: customerTrend,
    },
    deliveryPerformance: {
      averageTransitHours: calculateAverageTransitHours(deliveredShipments),
      delayedShipments,
      deliveredShipments: deliveredShipments.length,
      exceptionShipments,
      modeBreakdown: countBy(shipments, (shipment) => shipment.mode),
      onTimeRate: deliveryOnTimeRate,
      statusBreakdown: countBy(shipments, (shipment) => shipment.status),
    },
    driverPerformance,
    freightMetrics: {
      activeTransports: freightActive,
      containers: freightContainers,
      deliveredTransports: freightDelivered,
      documents: freightDocuments,
      refrigeratedTransports: freightTransports.filter((freight) => freight.refrigeratedRequired)
        .length,
      statusBreakdown: countBy(freightTransports, (freight) => freight.status),
      totalTransports: freightTransports.length,
      totalVolumeCbm: freightVolume,
      totalWeightKg: freightWeight,
      trend: freightTrend,
      typeBreakdown: countBy(freightTransports, (freight) => freight.freightType),
    },
    generatedAt: new Date().toISOString(),
    metrics,
    periodLabel: "Last 6 months",
    petTransportStats: {
      activePets: petActive,
      averageWeightKg: petWeights.length
        ? petWeights.reduce((total, weight) => total + weight, 0) / petWeights.length
        : 0,
      deliveredPets: petDelivered,
      documentationPending: petTransports.filter((pet) => pet.status === "DOCUMENTATION_PENDING")
        .length,
      healthClearanceRate,
      speciesBreakdown: countBy(petTransports, (pet) => pet.species),
      statusBreakdown: countBy(petTransports, (pet) => pet.status),
      totalPets: petTransports.length,
    },
    revenue: {
      outstanding: outstandingRevenue,
      paid: paidRevenue,
      total: totalRevenue,
      trend: revenueTrend,
    },
    shipmentAnalytics: {
      activeShipments,
      exceptionShipments,
      totalShipments: shipments.length,
      trend: shipmentTrend,
    },
    warehouseUtilization,
  };
}

const getCachedAnalyticsDashboardData = unstable_cache(
  buildAnalyticsDashboardData,
  ["analytics-dashboard-data"],
  {
    revalidate: 60,
    tags: ["analytics-dashboard"],
  },
);

export async function getAnalyticsDashboardData(
  user: AuthSessionUser,
): Promise<AnalyticsDashboardData> {
  return getCachedAnalyticsDashboardData(user);
}
