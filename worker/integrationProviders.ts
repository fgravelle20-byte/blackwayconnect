export const PROVIDERS = {
  google: {
    name: 'Google Agenda', authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scopes: 'openid email https://www.googleapis.com/auth/calendar.events.readonly',
    userinfo: 'https://openidconnect.googleapis.com/v1/userinfo', pkce: true,
  },
  microsoft: {
    name: 'Microsoft Outlook', authorization: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: 'openid email profile offline_access https://graph.microsoft.com/Calendars.Read',
    userinfo: 'https://graph.microsoft.com/oidc/userinfo', pkce: true,
  },
  atlassian: {
    name: 'Atlassian Jira', authorization: 'https://auth.atlassian.com/authorize',
    token: 'https://auth.atlassian.com/oauth/token', scopes: 'read:jira-work offline_access',
    userinfo: '', pkce: false,
  },
} as const;
export type Provider = keyof typeof PROVIDERS;
export function isProvider(value: string): value is Provider {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}
export type IntegrationItem = { id: string; title: string; detail: string; url?: string };
export async function providerJson(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init, redirect: 'error', signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...init.headers },
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'reconnect_required' : 'provider_unavailable');
  return response.json() as Promise<Record<string, any>>;
}
export async function readItems(provider: Provider, token: string): Promise<IntegrationItem[]> {
  const start = new Date().toISOString();
  const end = new Date(Date.now() + 30 * 86400000).toISOString();
  if (provider === 'google') {
    const params = new URLSearchParams({ timeMin: start, timeMax: end, singleEvents: 'true', orderBy: 'startTime', maxResults: '20' });
    const data = await providerJson(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, token);
    return (data.items || []).map((e: any) => ({ id: String(e.id), title: e.summary || '—', detail: e.start?.dateTime || e.start?.date || '', url: e.htmlLink }));
  }
  if (provider === 'microsoft') {
    const params = new URLSearchParams({ startDateTime: start, endDateTime: end, '$top': '20', '$orderby': 'start/dateTime', '$select': 'id,subject,start,webLink' });
    const data = await providerJson(`https://graph.microsoft.com/v1.0/me/calendarView?${params}`, token);
    return (data.value || []).map((e: any) => ({ id: String(e.id), title: e.subject || '—', detail: `${e.start?.dateTime || ''} ${e.start?.timeZone || ''}`, url: e.webLink }));
  }
  const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
    headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'reconnect_required' : 'provider_unavailable');
  const sites = await response.json() as { id: string; name: string; url: string; scopes: string[] }[];
  // Never assume the first resource is the one just authorized. Include each authorized Jira site.
  const allowed = sites.filter(s => s.scopes.includes('read:jira-work')).slice(0, 5);
  const items: IntegrationItem[] = [];
  for (const site of allowed) {
    const params = new URLSearchParams({ jql: 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC', maxResults: '10', fields: 'summary,status' });
    const data = await providerJson(`https://api.atlassian.com/ex/jira/${encodeURIComponent(site.id)}/rest/api/3/search/jql?${params}`, token);
    for (const issue of data.issues || []) items.push({
      id: `${site.id}:${issue.id}`, title: `${issue.key} · ${issue.fields?.summary || ''}`,
      detail: `${site.name} · ${issue.fields?.status?.name || ''}`, url: `${site.url}/browse/${encodeURIComponent(issue.key)}`,
    });
  }
  return items;
}
