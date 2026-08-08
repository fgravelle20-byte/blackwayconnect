import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "./Layout";
import { HomePage } from "./pages/HomePage";
import {
  ContactPage,
  FaqPage,
  GrowHubPage,
  MerciPage,
  MissionPage,
  PricingPage,
  PrivacyPage,
  ServicesPage,
  TeamPage,
  TermsPage,
} from "./pages/OtherPages";
import { DiagnosticPage } from "./pages/DiagnosticPage";
import { ToolsPage } from "./pages/ToolsPage";
import { PortalPage } from "./pages/PortalPage";
import { AppPlansPage } from "./pages/AppPlansPage";
import { CellulairePlansPage } from "./pages/CellulairePlansPage";
import { GrowthLandingPage } from "./pages/GrowthLandingPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { RelancePanierPage } from "./pages/RelancePanierPage";
import { SoumissionPage } from "./pages/SoumissionPage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { useLang } from "./i18n";
import { Seo } from "./Seo";
import { initTracking, trackPageView } from "./tracking";

function LangSync() {
  const { pathname } = useLocation();
  const { lang, setLang } = useLang();
  useEffect(() => {
    const wantsEn = pathname === "/en" || pathname.startsWith("/en/");
    if (wantsEn && lang !== "en") setLang("en");
    if (!wantsEn && lang !== "fr") setLang("fr");
  }, [pathname, lang, setLang]);
  return null;
}

function TrackingBoot() {
  const { pathname } = useLocation();
  useEffect(() => {
    initTracking();
  }, []);
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

function routes(prefix = "") {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="grow-hub" element={<GrowHubPage />} />
      <Route path="outils" element={<ToolsPage />} />
      <Route path="outils/relance-panier" element={<RelancePanierPage />} />
      <Route path="outils/soumission" element={<SoumissionPage />} />
      <Route path="outils/checklist" element={<ChecklistPage />} />
      <Route path="tools" element={<Navigate to="outils" replace />} />
      {/* Short aliases used by mobile bootstrap / ads / deep links */}
      <Route path="relance-panier" element={<Navigate to="outils/relance-panier" replace />} />
      <Route path="soumission" element={<Navigate to="outils/soumission" replace />} />
      <Route path="checklist" element={<Navigate to="outils/checklist" replace />} />
      <Route
        path="comparer"
        element={<Navigate to={{ pathname: "outils", hash: "comparateur" }} replace />}
      />
      <Route path="roi" element={<Navigate to={{ pathname: "outils", hash: "roi" }} replace />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="forfaits" element={<PricingPage />} />
      <Route path="forfaits-growth" element={<GrowthLandingPage />} />
      <Route path="growth" element={<Navigate to="forfaits-growth" replace />} />
      <Route path="forfaits-cellulaire" element={<CellulairePlansPage />} />
      <Route path="app-forfaits" element={<AppPlansPage />} />
      <Route path="comment-ca-marche" element={<HowItWorksPage />} />
      <Route path="how-it-works" element={<HowItWorksPage />} />
      <Route path="diagnostic" element={<DiagnosticPage />} />
      <Route path="score" element={<Navigate to="diagnostic" replace />} />
      <Route path="portail" element={<PortalPage />} />
      <Route path="portal" element={<PortalPage />} />
      <Route path="equipe" element={<TeamPage />} />
      <Route path="qui-sommes-nous" element={<MissionPage />} />
      <Route path="mission" element={<MissionPage />} />
      <Route path="faq" element={<FaqPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="merci" element={<MerciPage />} />
      <Route path="thank-you" element={<MerciPage />} />
      <Route path="confidentialite" element={<PrivacyPage />} />
      <Route path="conditions" element={<TermsPage />} />
      {prefix === "" ? null : <Route path="*" element={<Navigate to="/en" replace />} />}
    </>
  );
}

export default function App() {
  return (
    <>
      <LangSync />
      <TrackingBoot />
      <Seo />
      <Routes>
        <Route path="/" element={<Layout />}>
          {routes()}
        </Route>
        <Route path="/en" element={<Layout />}>
          {routes("/en")}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
