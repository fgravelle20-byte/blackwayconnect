export const MODULE_KEY = "google_reviews" as const;
export {
  listReviewCampaigns,
  createReviewCampaign,
  updateReviewCampaign,
  deleteReviewCampaign,
  createReviewRequestWithSuggestion,
} from "./review-service";
