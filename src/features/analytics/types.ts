export type AnalyticsTone = "accent" | "danger" | "info" | "success" | "warning";

export type AnalyticsTrendPoint = {
  label: string;
  value: number;
};

export type AnalyticsMetric = {
  delta: string;
  description: string;
  label: string;
  tone: AnalyticsTone;
  value: string;
};

export type AnalyticsBreakdownItem = {
  label: string;
  value: number;
};

export type AnalyticsDriverPerformance = {
  activeShipments: number;
  assignedShipments: number;
  deliveredShipments: number;
  exceptionShipments: number;
  name: string;
  onTimeRate: number;
  status: string;
};

export type AnalyticsWarehouseUtilization = {
  activeShipments: number;
  drivers: number;
  name: string;
  status: string;
  utilizationRate: number;
  vehicles: number;
};

export type AnalyticsInsight = {
  body: string;
  title: string;
  tone: AnalyticsTone;
};

export type AnalyticsDashboardData = {
  aiInsights: {
    insights: AnalyticsInsight[];
    model: string;
    provider: string;
  };
  customerGrowth: {
    newCustomers: number;
    totalCustomers: number;
    trend: AnalyticsTrendPoint[];
  };
  deliveryPerformance: {
    averageTransitHours: number;
    delayedShipments: number;
    deliveredShipments: number;
    exceptionShipments: number;
    modeBreakdown: AnalyticsBreakdownItem[];
    onTimeRate: number;
    statusBreakdown: AnalyticsBreakdownItem[];
  };
  driverPerformance: AnalyticsDriverPerformance[];
  freightMetrics: {
    activeTransports: number;
    containers: number;
    deliveredTransports: number;
    documents: number;
    refrigeratedTransports: number;
    statusBreakdown: AnalyticsBreakdownItem[];
    totalTransports: number;
    totalVolumeCbm: number;
    totalWeightKg: number;
    trend: AnalyticsTrendPoint[];
    typeBreakdown: AnalyticsBreakdownItem[];
  };
  generatedAt: string;
  metrics: AnalyticsMetric[];
  periodLabel: string;
  petTransportStats: {
    activePets: number;
    averageWeightKg: number;
    deliveredPets: number;
    documentationPending: number;
    healthClearanceRate: number;
    speciesBreakdown: AnalyticsBreakdownItem[];
    statusBreakdown: AnalyticsBreakdownItem[];
    totalPets: number;
  };
  revenue: {
    outstanding: number;
    paid: number;
    total: number;
    trend: AnalyticsTrendPoint[];
  };
  shipmentAnalytics: {
    activeShipments: number;
    exceptionShipments: number;
    totalShipments: number;
    trend: AnalyticsTrendPoint[];
  };
  warehouseUtilization: AnalyticsWarehouseUtilization[];
};
