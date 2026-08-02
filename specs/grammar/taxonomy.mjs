// Loomstack spec taxonomy.
// The compiler walks domain -> module -> entity and expands each entity into a
// deterministic block of addressable spec assertions. Nothing here is prose:
// every generated line is a single machine-checkable statement that a build
// agent can act on or a reviewer can diff.

export const DOMAINS = [
  { id: 'commerce', label: 'Commerce', tone: 'catalog and order capture' },
  { id: 'payments', label: 'Payments', tone: 'money movement and ledgers' },
  { id: 'logistics', label: 'Logistics', tone: 'fulfilment and last mile' },
  { id: 'mobility', label: 'Mobility', tone: 'ride hailing and fleet' },
  { id: 'social', label: 'Social', tone: 'graph, feed and messaging' },
  { id: 'video', label: 'Video', tone: 'short form and live streaming' },
  { id: 'creator', label: 'Creator', tone: 'monetisation and rights' },
  { id: 'ads', label: 'Ads', tone: 'auction, targeting and billing' },
  { id: 'lending', label: 'Lending', tone: 'underwriting and collections' },
  { id: 'wealth', label: 'Wealth', tone: 'brokerage and portfolios' },
  { id: 'insurance', label: 'Insurance', tone: 'policy and claims' },
  { id: 'identity', label: 'Identity', tone: 'accounts, KYC and consent' },
  { id: 'messaging', label: 'Messaging', tone: 'transactional delivery' },
  { id: 'search', label: 'Search', tone: 'retrieval and ranking' },
  { id: 'recsys', label: 'Recsys', tone: 'candidate generation and ranking' },
  { id: 'travel', label: 'Travel', tone: 'inventory and itineraries' },
  { id: 'food', label: 'Food', tone: 'menus, kitchens and dispatch' },
  { id: 'health', label: 'Health', tone: 'records and teleconsult' },
  { id: 'education', label: 'Education', tone: 'courses and assessment' },
  { id: 'gaming', label: 'Gaming', tone: 'sessions, economy and anti cheat' },
  { id: 'cloud', label: 'Cloud', tone: 'tenancy, quota and metering' },
  { id: 'devtools', label: 'Devtools', tone: 'pipelines and registries' },
  { id: 'support', label: 'Support', tone: 'tickets and knowledge' },
  { id: 'compliance', label: 'Compliance', tone: 'audit, retention and reporting' },
];

export const MODULES = [
  'core', 'gateway', 'ledger', 'workflow', 'catalog', 'pricing',
  'inventory', 'settlement', 'notification', 'analytics', 'moderation', 'risk',
  'partner', 'admin', 'mobile', 'webhook', 'archive', 'sandbox',
];

export const ENTITY_ROOTS = [
  'account', 'profile', 'session', 'record', 'request', 'batch', 'policy',
  'rule', 'quota', 'ticket', 'transfer', 'schedule', 'template', 'snapshot',
];

export const ROLES = [
  'owner', 'admin', 'operator', 'analyst', 'auditor', 'partner',
  'support', 'member', 'guest', 'service',
];

export const ACTIONS = ['create', 'read', 'update', 'delete', 'list', 'export', 'approve', 'archive'];

export const STATES = [
  'draft', 'pending', 'active', 'held', 'review', 'settled',
  'suspended', 'expired', 'closed', 'purged',
];

export const FIELD_TYPES = [
  ['id', 'uuid', 'primary key, v7 ordered'],
  ['tenant_id', 'uuid', 'row level security anchor'],
  ['status', 'enum', 'state machine cursor'],
  ['label', 'text', 'human readable, 120 char cap'],
  ['amount_minor', 'bigint', 'integer minor units only'],
  ['currency', 'char(3)', 'ISO 4217'],
  ['metadata', 'jsonb', 'caller supplied, 16 KB cap'],
  ['version', 'int', 'optimistic lock counter'],
  ['created_at', 'timestamptz', 'set by database default'],
  ['updated_at', 'timestamptz', 'trigger maintained'],
  ['deleted_at', 'timestamptz', 'soft delete tombstone'],
  ['created_by', 'uuid', 'actor reference'],
  ['idempotency_key', 'text', 'unique per tenant, 24 h window'],
  ['trace_id', 'text', 'W3C traceparent'],
  ['region', 'text', 'data residency shard'],
  ['checksum', 'bytea', 'sha256 of canonical body'],
];

export const SURFACES = ['web', 'ios', 'android', 'cli', 'api', 'admin'];
export const LOCALES = ['en-US', 'id-ID', 'zh-CN', 'ja-JP', 'es-ES', 'pt-BR', 'hi-IN', 'ar-EG'];

export function entityName(moduleId, root, index) {
  return `${moduleId}_${root}${index > 0 ? `_${index + 1}` : ''}`;
}
