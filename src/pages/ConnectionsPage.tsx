import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../i18n';
import './connections.css';

type Provider = 'google' | 'microsoft' | 'atlassian';
type Connection = { id: Provider; name: string; available: boolean; connected: boolean; updated: number | null };
type Item = { id: string; title: string; detail: string; url?: string };
type Identity = { label: string; loginProvider: string };
const COPY = {
  google: { mark: 'G', fr: 'Vos prochains rendez-vous Google, directement dans votre espace.', en: 'Your upcoming Google appointments, right in your workspace.' },
  microsoft: { mark: 'M', fr: 'Votre calendrier Outlook pour garder le fil de votre journée.', en: 'Your Outlook calendar to keep your day on track.' },
  atlassian: { mark: 'A', fr: 'Vos tâches Jira ouvertes, regroupées par site autorisé.', en: 'Your open Jira tasks across authorized sites.' },
};
const authLinks: Record<Provider, string> = {
  google: 'https://myaccount.google.com/connections',
  microsoft: 'https://myapplications.microsoft.com/',
  atlassian: 'https://id.atlassian.com/manage-profile/apps',
};
export function ConnectionsPage() {
  const { lang } = useLang(); const fr = lang === 'fr';
  const [params, setParams] = useSearchParams();
  const [providers, setProviders] = useState<Connection[]>([]);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [items, setItems] = useState<Partial<Record<Provider, Item[]>>>({});
  const [selected, setSelected] = useState<Provider | null>(null);
  const [confirm, setConfirm] = useState<Provider | null>(null);
  const path = (value: string) => `${fr ? '' : '/en'}${value}`;
  const message = (code: string) => {
    const messages: Record<string, [string, string]> = {
      setup_required: ['Cette connexion est en cours de préparation.', 'This connection is being prepared.'],
      sign_in_required: ['Connectez-vous avec Google ou Microsoft pour ouvrir votre espace sécurisé.', 'Sign in with Google or Microsoft to open your secure workspace.'],
      reconnect_required: ['L’autorisation a expiré ou a été retirée. Reconnectez cet outil.', 'Permission expired or was withdrawn. Reconnect this tool.'],
      retry_later: ['Une actualisation est déjà en cours. Réessayez dans un instant.', 'A refresh is already running. Please try again shortly.'],
    };
    return (messages[code] || ['Connexion momentanément indisponible. Réessayez.', 'Connection temporarily unavailable. Please try again.'])[fr ? 0 : 1];
  };
  const load = useCallback(async () => {
    const response = await fetch('/api/integrations', { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error('temporarily_unavailable');
    const data = await response.json() as { identity: Identity | null; providers: Connection[] };
    setIdentity(data.identity); setProviders(data.providers);
  }, []);
  useEffect(() => { void load().catch(() => setError(fr ? 'Impossible de charger vos connexions.' : 'Unable to load your connections.')).finally(() => setLoading(false)); }, [load, fr]);
  useEffect(() => {
    const result = params.get('connection');
    if (!result) return;
    setNotice(result === 'success' ? (fr ? 'Connexion autorisée. Votre outil est prêt à consulter.' : 'Connection authorized. Your tool is ready to view.') : result === 'cancelled' ? (fr ? 'Autorisation annulée. Aucun nouveau compte connecté.' : 'Authorization cancelled. No new account connected.') : (fr ? 'La connexion n’a pas abouti. Vous pouvez réessayer.' : 'Connection did not complete. You can try again.'));
    setParams({}, { replace: true });
  }, [params, setParams, fr]);
  async function action(provider: Provider, actionName: 'start' | 'disconnect' | 'items') {
    setBusy(provider); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/integrations/${provider}/${actionName}?lang=${lang}`, { method: actionName === 'items' ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json() as { error?: string; url?: string; items?: Item[] };
      if (!response.ok) throw new Error(data.error || 'temporarily_unavailable');
      if (actionName === 'start') {
        const destination = new URL(data.url || "");
        if (!['accounts.google.com', 'login.microsoftonline.com', 'auth.atlassian.com'].includes(destination.hostname) || destination.protocol !== 'https:') throw new Error('temporarily_unavailable');
        window.location.assign(destination.href); return;
      }
      if (actionName === 'items') { setItems(old => ({ ...old, [provider]: data.items || [] })); setSelected(provider); }
      if (actionName === 'disconnect') {
        setItems(old => ({ ...old, [provider]: undefined })); setSelected(null); setConfirm(null);
        setNotice(fr ? 'Accès supprimé de BlackWayConnect. Vous pouvez aussi retirer l’autorisation dans les paramètres du fournisseur.' : 'Access removed from BlackWayConnect. You can also revoke permission in the provider’s settings.');
        await load();
      }
    } catch (e) { setError(message(e instanceof Error ? e.message : '')); }
    finally { setBusy(null); }
  }
  async function logout() {
    setBusy('logout'); setError('');
    try {
      const response = await fetch('/api/integrations/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok) throw new Error();
      setItems({}); setSelected(null); await load();
    } catch { setError(message('temporarily_unavailable')); } finally { setBusy(null); }
  }
  return <section className="section section--page bw-connections"><div className="shell">
    <Link className="bw-connections__back" to={path('/portail')}>← {fr ? 'Mon portail' : 'My portal'}</Link>
    <header className="bw-connections__hero">
      <div><p className="eyebrow">BLACKWAYCONNECT / {fr ? 'MES CONNEXIONS' : 'MY CONNECTIONS'}</p>
      <h1 className="display page-hero__title">{fr ? 'Vos outils. Un seul espace.' : 'Your tools. One workspace.'}</h1>
      <p className="lede">{fr ? 'Retrouvez vos rendez-vous et vos tâches sans changer constamment d’application. Vous choisissez les comptes et gardez le contrôle des accès.' : 'See your appointments and tasks without constantly switching apps. You choose the accounts and control access.'}</p></div>
      <div className="bw-connections__graphic" aria-hidden="true"><span>G</span><span>M</span><strong>BW<span>CONNECT</span></strong><span>A</span><span>↗</span></div>
    </header>
    <div className="bw-connections__identity">
      <div><strong>{identity ? identity.label : fr ? 'Votre espace de connexions personnel' : 'Your personal connections workspace'}</strong>
      <p>{identity ? (fr ? `Pour retrouver cet espace, reconnectez-vous avec le même compte ${identity.loginProvider === 'google' ? 'Google' : 'Microsoft'}.` : `To return to this workspace, sign in with the same ${identity.loginProvider === 'google' ? 'Google' : 'Microsoft'} account.`) : (fr ? 'Commencez avec Google ou Microsoft, puis ajoutez vos autres outils. Cette connexion protège vos données externes.' : 'Start with Google or Microsoft, then add your other tools. This sign-in protects your external data.')}</p></div>
      {identity && <button className="btn btn--ghost" disabled={!!busy} onClick={() => void logout()}>{fr ? 'Fermer ma session' : 'Sign out'}</button>}
    </div>
    {error && <p role="alert" className="form-status form-status--err">{error}</p>}
    {notice && <p role="status" className="bw-connections__notice">{notice}</p>}
    {loading ? <p role="status">{fr ? 'Chargement…' : 'Loading…'}</p> : <div className="bw-connections__grid">{providers.map(provider => <article className="bw-connections__card" key={provider.id}>
      <div className="bw-connections__card-top"><span className={`bw-connections__mark bw-connections__mark--${provider.id}`} aria-hidden="true">{COPY[provider.id].mark}</span><span className={`bw-connections__badge${provider.connected ? ' is-connected' : ''}`}>{provider.connected ? (fr ? 'Connecté' : 'Connected') : provider.available ? (fr ? 'Disponible' : 'Available') : (fr ? 'En préparation' : 'In preparation')}</span></div>
      <h2>{provider.name}</h2><p>{COPY[provider.id][fr ? 'fr' : 'en']}</p>
      <p className="bw-connections__permission">{fr ? 'Consultation uniquement · aucune modification' : 'Read only · no changes'}</p>
      <div className="bw-connections__actions">
      {provider.connected && <button className="btn btn--primary" disabled={!!busy} onClick={() => void action(provider.id, 'items')}>{busy === provider.id ? '…' : fr ? 'Consulter' : 'View'}</button>}
      <button className={`btn ${provider.connected ? 'btn--ghost' : 'btn--primary'}`} disabled={!provider.available || !!busy || (!identity && provider.id === 'atlassian')} onClick={() => void action(provider.id, 'start')}>{provider.connected ? (fr ? 'Reconnecter' : 'Reconnect') : !provider.available ? (fr ? 'Bientôt disponible' : 'Coming soon') : !identity && provider.id !== 'atlassian' ? (fr ? 'Se connecter' : 'Sign in') : (fr ? 'Connecter' : 'Connect')}</button>
      {provider.connected && <button className="bw-connections__text-button" disabled={!!busy} onClick={() => setConfirm(provider.id)}>{fr ? 'Retirer' : 'Remove'}</button>}
      </div>
      {confirm === provider.id && <div className="bw-connections__confirm"><p>{fr ? 'Retirer cet accès de BlackWayConnect ? Les données chez votre fournisseur restent intactes.' : 'Remove this access from BlackWayConnect? Your data at the provider stays intact.'}</p><button className="btn btn--ghost" disabled={!!busy} onClick={() => void action(provider.id, 'disconnect')}>{fr ? 'Confirmer le retrait' : 'Confirm removal'}</button><button className="bw-connections__text-button" onClick={() => setConfirm(null)}>{fr ? 'Annuler' : 'Cancel'}</button></div>}
      {provider.connected && <a className="bw-connections__manage" href={authLinks[provider.id]} target="_blank" rel="noopener noreferrer">{fr ? 'Gérer les autorisations chez le fournisseur ↗' : 'Manage provider permissions ↗'}</a>}
    </article>)}</div>}
    {selected && <section className="bw-connections__results" aria-live="polite"><h2>{providers.find(p => p.id === selected)?.name}</h2><p>{selected === 'atlassian' ? (fr ? 'Jusqu’à 10 tâches ouvertes par site, sur 5 sites autorisés maximum.' : 'Up to 10 open tasks per site, across at most 5 authorized sites.') : (fr ? 'Vos 20 prochains rendez-vous sur les 30 prochains jours.' : 'Your next 20 appointments in the coming 30 days.')}</p>
      {!items[selected]?.length ? <p>{fr ? 'Aucun élément trouvé pour cette période ou ces critères.' : 'No items found for this period or these criteria.'}</p> : <ul>{items[selected]?.map(item => <li key={item.id}><div><strong>{item.title}</strong><p>{item.detail}</p></div>{item.url?.startsWith('https://') && <a href={item.url} target="_blank" rel="noopener noreferrer">{fr ? 'Ouvrir ↗' : 'Open ↗'}</a>}</li>)}</ul>}
    </section>}
    <p className="bw-connections__footnote">{fr ? 'Vos abonnements aux outils externes restent gérés par leurs fournisseurs. Aucun mot de passe externe n’est demandé par BlackWayConnect.' : 'Subscriptions to external tools remain managed by their providers. BlackWayConnect never asks for your external passwords.'}</p>
  </div></section>;
}
