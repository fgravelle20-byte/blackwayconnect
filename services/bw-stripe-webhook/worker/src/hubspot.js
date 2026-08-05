/**
 * Client HubSpot pour Cloudflare Worker (fetch natif, token passe en parametre).
 */
import { HUBSPOT } from './config.js';

const BASE = 'https://api.hubapi.com';

export function clientHubSpot(token, log = console.log) {
  async function hs(method, path, body, { retries = 3 } = {}) {
    let lastErr;
    for (let attempt = 0; attempt < retries; attempt++) {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HubSpot ${res.status} ${path}`);
        await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
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

  return {
    hs,

    async upsertContact(email, props) {
      const search = await hs('POST', '/crm/v3/objects/contacts/search', {
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
        properties: ['email'],
        limit: 1,
      });
      const nettoye = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined && v !== null));
      if (search.total > 0) {
        const id = search.results[0].id;
        await hs('PATCH', `/crm/v3/objects/contacts/${id}`, { properties: nettoye });
        return { id, created: false };
      }
      const created = await hs('POST', '/crm/v3/objects/contacts', {
        properties: { email, ...nettoye },
      });
      return { id: created.id, created: true };
    },

    async upsertCompany(domain, name) {
      if (!domain) return null;
      const search = await hs('POST', '/crm/v3/objects/companies/search', {
        filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }],
        properties: ['domain'],
        limit: 1,
      });
      if (search.total > 0) return search.results[0].id;
      const created = await hs('POST', '/crm/v3/objects/companies', {
        properties: { domain, name: name || domain },
      });
      return created.id;
    },

    async findDealByStripeId(paymentId) {
      const search = await hs('POST', '/crm/v3/objects/deals/search', {
        filterGroups: [
          { filters: [{ propertyName: 'bw_stripe_payment_id', operator: 'EQ', value: paymentId }] },
        ],
        properties: ['dealname'],
        limit: 1,
      });
      return search.total > 0 ? search.results[0].id : null;
    },

    async createDeal(properties) {
      const nettoye = Object.fromEntries(Object.entries(properties).filter(([, v]) => v !== undefined && v !== null));
      const deal = await hs('POST', '/crm/v3/objects/deals', { properties: nettoye });
      return deal.id;
    },

    async associate(fromType, fromId, toType, toId, typeId) {
      if (!fromId || !toId) return;
      await hs('PUT', `/crm/v4/objects/${fromType}/${fromId}/associations/${toType}/${toId}`, [
        { associationCategory: 'HUBSPOT_DEFINED', associationTypeId: typeId },
      ]);
    },

    async createNote(dealId, contactId, body) {
      const note = await hs('POST', '/crm/v3/objects/notes', {
        properties: { hs_note_body: body, hs_timestamp: Date.now() },
      });
      await this.associate('notes', note.id, 'deals', dealId, HUBSPOT.assoc.noteToDeal);
      if (contactId) await this.associate('notes', note.id, 'contacts', contactId, HUBSPOT.assoc.noteToContact);
      return note.id;
    },

    async createDeliveryTicket(properties, dealId, contactId) {
      try {
        const ticket = await hs('POST', '/crm/v3/objects/tickets', { properties });
        await this.associate('tickets', ticket.id, 'deals', dealId, 28);
        if (contactId) await this.associate('tickets', ticket.id, 'contacts', contactId, 16);
        return ticket.id;
      } catch (e) {
        log(JSON.stringify({ level: 'warn', msg: 'ticket non cree (scope tickets manquant ?)', err: String(e).slice(0, 200) }));
        return null;
      }
    },
  };
}
