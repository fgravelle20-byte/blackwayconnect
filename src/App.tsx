import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./Layout";
import { HomePage } from "./pages/HomePage";
import { useLang } from "./i18n";
import { Seo } from "./Seo";
import { initTracking, trackPageView } from "./tracking";

const loadOther = () => import("./pages/OtherPages");
const ContactPage = lazy(() => loadOther().then((m) => ({ default: m.ContactPage })));
const FaqPage = lazy(() => loadOther().then((m) => ({ default: m.FaqPage })));
const GrowHubPage = lazy(() => loadOther().then((m) => ({ default: m.GrowHubPage })));
const MerciPage = lazy(() => loadOther().then((m) => ({ default: m.MerciPage })));
const MissionPage = lazy(() => loadOther().then((m) => ({ default: m.MissionPage })));
const PricingPage = lazy(() => loadOther().then((m) => ({ default: m.PricingPage })));
const PrivacyPage = lazy(() => loadOther().then((m) => ({ default: m.PrivacyPage })));
const ServicesPage = lazy(() => loadOther().then((m) => ({ default: m.ServicesPage })));
const TeamPage = lazy(() => loadOther().then((m) => ({ default: m.TeamPage })));
const TermsPage = lazy(() => loadOther().then((m) => ({ default: m.TermsPage })));
const RefundPage = lazy(() => loadOther().then((m) => ({ default: m.RefundPage })));
const DiagnosticPage = lazy(() => import("./pages/DiagnosticPage").then((m) => ({ default: m.DiagnosticPage })));
const ToolsPage = lazy(() => import("./pages/ToolsPage").then((m) => ({ default: m.ToolsPage })));
const PortalPage = lazy(() => import("./pages/PortalPage").then((m) => ({ default: m.PortalPage })));
const PortalCapturePage = lazy(() => import("./pages/PortalCapturePage").then((m) => ({ default: m.PortalCapturePage })));
const PortalCellToolPage = lazy(() => import("./pages/PortalCellToolPage").then((m) => ({ default: m.PortalCellToolPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const AppPlansPage = lazy(() => import("./pages/AppPlansPage").then((m) => ({ default: m.AppPlansPage })));
const CellulairePlansPage = lazy(() => import("./pages/CellulairePlansPage").then((m) => ({ default: m.CellulairePlansPage })));
const ModulesIaPage = lazy(() => import("./pages/ModulesIaPage").then((m) => ({ default: m.ModulesIaPage })));
const GrowthLandingPage = lazy(() => import("./pages/GrowthLandingPage").then((m) => ({ default: m.GrowthLandingPage })));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage").then((m) => ({ default: m.HowItWorksPage })));
const RelancePanierPage = lazy(() => import("./pages/RelancePanierPage").then((m) => ({ default: m.RelancePanierPage })));
const SoumissionPage = lazy(() => import("./pages/SoumissionPage").then((m) => ({ default: m.SoumissionPage })));
const ChecklistPage = lazy(() => import("./pages/ChecklistPage").then((m) => ({ default: m.ChecklistPage })));
const MaquettesIndexPage = lazy(() => import("./maquettes/MaquettesIndexPage").then((m) => ({ default: m.MaquettesIndexPage })));
const UpcomingMaquette = lazy(() => import("./maquettes/MaquettesIndexPage").then((m) => ({ default: m.UpcomingMaquette })));
const GMartelApp = lazy(() => import("./maquettes/g-martel/GMartelApp").then((m) => ({ default: m.GMartelApp })));
const AvenirChatbotApp = lazy(() => import("./vorixa-chatbot/AvenirChatbotApp").then((m) => ({ default: m.AvenirChatbotApp })));
const OwnerConsolePage = lazy(() => import("./pages/OwnerConsolePage").then((m) => ({ default: m.OwnerConsolePage })));
const OwnerDashboardPage = lazy(() => import("./pages/OwnerDashboardPage").then((m) => ({ default: m.OwnerDashboardPage })));
const MasterCrmPage = lazy(() => import("./pages/MasterCrmPage").then((m) => ({ default: m.MasterCrmPage })));
const KingLeadsPage = lazy(() => import("./pages/KingLeadsPage").then((m) => ({ default: m.KingLeadsPage })));
const PlatformPage = lazy(() => import("./pages/PlatformPage").then((m) => ({ default: m.PlatformPage })));

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
      <Route path="plateforme" element={<PlatformPage />} />
      <Route path="platform" element={<PlatformPage />} />
      <Route path="grow-hub" element={<GrowHubPage />} />
      <Route path="growhub" element={<Navigate to="grow-hub" replace />} />
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
      <Route path="cellulaire" element={<Navigate to="forfaits-cellulaire" replace />} />
      <Route path="pack-cellulaire" element={<Navigate to="forfaits-cellulaire" replace />} />
      <Route path="modules-ia" element={<ModulesIaPage />} />
      <Route path="chatbot" element={<Navigate to={{ pathname: "modules-ia", hash: "chatbot" }} replace />} />
      <Route path="accueil-vocal" element={<Navigate to={{ pathname: "modules-ia", hash: "vocal" }} replace />} />
      <Route path="app-forfaits" element={<AppPlansPage />} />
      <Route path="comment-ca-marche" element={<HowItWorksPage />} />
      <Route path="how-it-works" element={<HowItWorksPage />} />
      <Route path="diagnostic" element={<DiagnosticPage />} />
      <Route path="score" element={<Navigate to="diagnostic" replace />} />
      <Route path="portail" element={<PortalPage />} />
      <Route path="portail/claim" element={<PortalPage />} />
      <Route path="portail/capture" element={<PortalCapturePage />} />
      <Route path="portail/pipeline" element={<PortalCellToolPage />} />
      <Route path="portail/cell-checkout" element={<PortalCellToolPage />} />
      <Route path="portail/streak" element={<PortalCellToolPage />} />
      <Route path="portail/fleet" element={<PortalCellToolPage />} />
      <Route path="portail/merge" element={<PortalCellToolPage />} />
      <Route path="payer" element={<CheckoutPage />} />
      <Route path="portal" element={<PortalPage />} />
      <Route path="portal/claim" element={<PortalPage />} />
      <Route path="portal/capture" element={<PortalCapturePage />} />
      <Route path="portal/pipeline" element={<PortalCellToolPage />} />
      <Route path="portal/cell-checkout" element={<PortalCellToolPage />} />
      <Route path="portal/streak" element={<PortalCellToolPage />} />
      <Route path="portal/fleet" element={<PortalCellToolPage />} />
      <Route path="portal/merge" element={<PortalCellToolPage />} />
      <Route path="crm" element={<MasterCrmPage />} />
      <Route path="leads" element={<KingLeadsPage />} />
      <Route path="master-leads" element={<Navigate to="leads" replace />} />
      <Route path="equipe" element={<TeamPage />} />
      <Route path="qui-sommes-nous" element={<MissionPage />} />
      <Route path="mission" element={<MissionPage />} />
      <Route path="faq" element={<FaqPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="merci" element={<MerciPage />} />
      <Route path="thank-you" element={<MerciPage />} />
      <Route path="confidentialite" element={<PrivacyPage />} />
      <Route path="conditions" element={<TermsPage />} />
      <Route path="remboursement" element={<RefundPage />} />
      <Route path="refund" element={<RefundPage />} />
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
      <Suspense fallback={null}>
      <Routes>
        <Route path="/controle" element={<OwnerConsolePage />} />
        <Route path="/controle/app" element={<OwnerDashboardPage />} />
        <Route path="/vorixa/chatbot" element={<AvenirChatbotApp />} />
        <Route path="/vorixa/chatbot/*" element={<AvenirChatbotApp />} />
        <Route path="/maquettes/l-avenir" element={<Navigate to="/vorixa/chatbot/apercu" replace />} />
        <Route path="/maquettes" element={<MaquettesIndexPage />} />
        <Route path="/maquettes/g-martel/*" element={<GMartelApp />} />
        <Route path="/maquettes/:slug/*" element={<UpcomingMaquette />} />
        <Route path="/" element={<Layout />}>
          {routes()}
        </Route>
        <Route path="/en" element={<Layout />}>
          {routes("/en")}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}
