/**
 * Content linter — category (b): ENTERPRISE / BUSINESS / PAID content.
 *
 * kvendra.dev publishes open-core conceptual material only. Commercial,
 * Enterprise, pricing/tier-as-SKU, paid-service and sales material is blocking.
 * Source of policy: ADR-KVD-A24AB7 (content policy) + AC-6(b).
 *
 * Unlike category (a), a category (b) match CAN be escaped per-line with:
 *     <!-- linter-allow: <rule-id> reason -->
 * placed on the line immediately before the offending line. Use sparingly and
 * only when the term is a generic false positive (e.g. the word "enterprise"
 * used in a non-product sense). index.mjs enforces that the escape names this
 * exact rule id.
 */

export const CATEGORY = 'b';
export const CATEGORY_LABEL = 'enterprise-business-paid';

export const rules = [
  {
    id: 'commercial-link',
    description:
      'Link/mention of the commercial surfaces (kvendra.com, kvendra.ai). ' +
      'Allowed ONLY inside a marked commercial-pointer block (ADR-KVD-A24AB7 carve-out).',
    regex: /\bkvendra\.(com|ai)\b/i,
    escapable: false,
  },
  {
    id: 'commercial-funnel-link',
    description: 'Direct link into the hosted signup/billing funnel',
    regex: /\bapp\.kvendra\.cloud\/(signup|pricing|billing|checkout|upgrade)\b/i,
    escapable: false,
  },
  {
    id: 'private-repo-name',
    description: 'Private/closed repo name (kvendra-enterprise|helm|web)',
    regex: /\bkvendra-(enterprise|helm|web)\b/i,
  },
  {
    id: 'closed-component',
    description: 'Closed component id (CMP-KVD-ENTERPRISE|DASHBOARD|WEB)',
    regex: /\bCMP-KVD-(ENTERPRISE|DASHBOARD|WEB)\b/,
  },
  {
    id: 'pricing-tier-sku',
    description: 'Pricing / tier sold as a commercial SKU',
    regex: /\b(pricing|per[- ]seat|per[- ]month|\/mo\b|\$\d+|free\/pro|pro\/team|team\/enterprise|tier[- ]gat)/i,
  },
  {
    id: 'paid-service',
    description: 'Paid / hosted commercial service',
    regex: /\b(cloud backup|profile sync|shared workspaces?|billing|subscription|checkout|upgrade to)\b/i,
  },
  {
    id: 'sso-enterprise-auth',
    description: 'Enterprise auth product surface (SSO/SAML/SCIM)',
    regex: /\b(SSO|SAML|SCIM)\b/,
  },
  {
    id: 'commercial-identity-stripe',
    description: 'Stripe / payment processor identity',
    regex: /\bstripe\b/i,
  },
  {
    id: 'sales-contact',
    description: 'Sales / commercial contact address',
    regex: /\bsales@[a-z0-9.-]+/i,
  },
  {
    id: 'ga4-measurement-id',
    description: 'Google Analytics 4 measurement id (G-XXXXXXXX)',
    regex: /\bG-[A-Z0-9]{8,}\b/,
  },
  {
    id: 'google-ads-id',
    description: 'Google Ads conversion id (AW-NNNN)',
    regex: /\bAW-\d+/,
  },
];
