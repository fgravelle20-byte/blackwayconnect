import { Navigate } from "react-router-dom";
import { useLang } from "../i18n";

/** Legacy URL → Type B cellulaire storefront. */
export function AppPlansPage() {
  const { path } = useLang();
  return <Navigate to={path("/forfaits-cellulaire")} replace />;
}
