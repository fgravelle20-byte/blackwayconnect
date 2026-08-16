export const MODULE_KEY = "business" as const;
export {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  listDeals,
  createDeal,
  ensureDefaultPipeline,
} from "./business-service";
export {
  computeClientRoiDashboard,
  createMarketingExpense,
  createManualRevenue,
  listMarketingExpenses,
} from "./roi-service";
export type { RoiClientRow, RoiDashboard } from "./roi-service";
