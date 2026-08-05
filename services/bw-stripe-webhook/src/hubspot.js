/**
 * Client HubSpot minimal pour BlackWayConnect.
 * Utilise fetch natif (Node >= 18). Aucune dependance.
 */
import { ENV, HUBSPOT } from './config.js';
import { log } from './lib/logger.js';

const BASE = 'https://api.hubapi.com';

async function hs(method, path, body, { retries = 3 } = {}) {
  if (ENV.dryRun) {
    log.info('DRY_RUN hubspot', { method, path, body });
    return { id: `dry_${Math.random().toString(36).slice(2, 10)}`, properties: body?.properties || {} };
  }
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${ENV.hubspotToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 429 || res.status >= 500) {
      const wait = 400 * 2 ** attempt;
      lastErr = new Error(`HubSpot ${res.status} sur ${path}`);
      log.warn('hubspot retry', { status: res.status, path, attempt, wait });
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`HubSpot ${res.status} ${method} ${path} :: ${text.slice(0, 400)}`);
      err.status = res.status;
      throw err;
    }
    return text ? JSON.parse(text) : {};
  }
  throw lastErr;
}

/** Cherche un contact par email, le cree sinon. Retourne { id, created }. */
export async function upsertContact(email, props) {
  if (!email) throw new Error('email requis pour upsertContact');
  const search = await hs('POST', '/crm/v3/objects/contacts/search', {
    filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
    properties: ['email', 'firstname', 'lastname', 'bw_lead_score'],
    limit: 1,
  });

  if (search.total > 0) {
    const id = search.results[0].id;
    await hs('PATCH', `/crm/v3/objects/contacts/${id}`, { properties: props });
    log.info('contact mis a jour', { id, email });
    return { id, created: false };
  }

  const created = await hs('POST', '/crm/v3/objects/contacts', {
    properties: { email, ...props },
  });
  log.info('contact cree', { id: created.id, email });
  return { id: created.id, created: true };
}

/** Cherche une entreprise par domaine, la cree sinon. Retourne id ou null. */
export async function upsertCompany(domain, name) {
  if (!domain) return null;
  const search = await hs('POST', '/crm/v3/objects/companies/search', {
    filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }],
    properties: ['domain', 'name'],
    limit: 1,
  });
  if (search.total > 0) return search.results[0].id;
  const created = await hs('POST', '/crm/v3/objects/companies', {
    properties: { domain, name: name || domain },
  });
  log.info('company creee', { id: created.id, domain });
  return created.id;
}

/** Evite de recreer un deal si l'event Stripe est rejoue. */
export async function findDealByStripeId(paymentId) {
  const search = await hs('POST', '/crm/v3/objects/deals/search', {
    filterGroups: [
      { filters: [{ propertyName: 'bw_stripe_payment_id', operator: 'EQ', value: paymentId }] },
    ],
    properties: ['dealname', 'bw_stripe_payment_id'],
    limit: 1,
  });
  return search.total > 0 ? search.results[0].id : null;
}

export async function createDeal(properties) {
  const deal = await hs('POST', '/crm/v3/objects/deals', { properties });
  log.info('deal cree', { id: deal.id, name: properties.dealname });
  return deal.id;
}

export async function associate(fromType, fromId, toType, toId, typeId) {
  if (!fromId || !toId) return;
  await hs('PUT', `/crm/v4/objects/${fromType}/${fromId}/associations/${toType}/${toId}`, [
    { associationCategory: 'HUBSPOT_DEFINED', associationTypeId: typeId },
  ]);
}

/** Note horodatee sur le deal : trace d'audit du paiement. */
export async function createNote(dealId, contactId, body) {
  const note = await hs('POST', '/crm/v3/objects/notes', {
    properties: { hs_note_body: body, hs_timestamp: Date.now() },
  });
  await associate('notes', note.id, 'deals', dealId, HUBSPOT.assoc.noteToDeal);
  if (contactId) await associate('notes', note.id, 'contacts', contactId, HUBSPOT.assoc.noteToContact);
  return note.id;
}

/** Ticket de livraison. Silencieux si le scope tickets manque encore. */
export async function createDeliveryTicket(properties, dealId, contactId) {
  try {
    const ticket = await hs('POST', '/crm/v3/objects/tickets', { properties });
    await associate('tickets', ticket.id, 'deals', dealId, 28);
    if (contactId) await associate('tickets', ticket.id, 'contacts', contactId, 16);
    log.info('ticket de livraison cree', { id: ticket.id });
    return ticket.id;
  } catch (e) {
    log.warn('ticket non cree (scope tickets manquant ?)', { err: String(e).slice(0, 200) });
    return null;
  }
}
