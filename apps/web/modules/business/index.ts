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
