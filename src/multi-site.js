'use strict';

const { errors } = require('@strapi/utils');

const SITE_UID = 'api::site.site';

// Content types that belong to a single site via their `site` relation
const SCOPED_UIDS = [
  'api::article.article',
  'api::author.author',
  'api::category.category',
  'api::global.global',
  'api::about.about',
  'api::listen-page.listen-page',
  'api::listen-latest-page.listen-latest-page',
  'api::page-seo.page-seo',
];

const CONDITION_PREFIX = 'belongs-to-site-';
// Conditions registered with `plugin: 'admin'` are namespaced as `admin::<name>`
const REGISTERED_CONDITION_PREFIX = `admin::${CONDITION_PREFIX}`;

const CONTENT_MANAGER_ACTIONS = {
  create: 'plugin::content-manager.explorer.create',
  update: 'plugin::content-manager.explorer.update',
};

/**
 * Registers one RBAC condition per Site entry, e.g. "Belongs to site: JetVesper".
 * Apply these conditions to a role's content permissions (Settings > Roles)
 * to restrict that role to a single site's content.
 *
 * Note: conditions are built at startup, so restart Strapi after adding a new Site.
 */
async function registerSiteConditions(strapi) {
  const sites = await strapi.db.query(SITE_UID).findMany();

  if (sites.length === 0) {
    return;
  }

  const conditions = sites.map((site) => ({
    displayName: `Belongs to site: ${site.name}`,
    name: `${CONDITION_PREFIX}${site.documentId}`,
    category: 'Sites',
    plugin: 'admin',
    handler: () => ({ 'site.documentId': site.documentId }),
  }));

  await strapi.admin.services.permission.conditionProvider.registerMany(conditions);
}

/**
 * Document service middleware that keeps site-scoped admin users inside their site:
 * - on create: force-assigns the user's site (or validates it when they have several),
 * - on update: prevents moving an entry to another site.
 *
 * Users whose role has no site condition (e.g. Super Admin) are unaffected,
 * and so are non-admin operations (public API, seed scripts, etc.).
 */
function registerSiteScopeMiddleware(strapi) {
  strapi.documents.use(async (context, next) => {
    if (!SCOPED_UIDS.includes(context.uid)) {
      return next();
    }

    if (context.action !== 'create' && context.action !== 'update') {
      return next();
    }

    const adminUser = getAdminUser(strapi);
    if (!adminUser) {
      return next();
    }

    const allowedSites = await getAllowedSiteDocumentIds(
      strapi,
      adminUser,
      context.action,
      context.uid
    );
    if (allowedSites === null) {
      return next();
    }

    const data = { ...(context.params.data || {}) };

    if (context.action === 'update') {
      // Keep the existing site: scoped users must not move entries between sites
      delete data.site;
    } else if (allowedSites.length === 1) {
      data.site = allowedSites[0];
    } else {
      const requested = await resolveRequestedSite(strapi, data.site);
      if (!requested || !allowedSites.includes(requested)) {
        throw new errors.ApplicationError(
          'Please assign this entry to one of the sites you have access to.'
        );
      }
      data.site = requested;
    }

    context.params.data = data;
    return next();
  });
}

function getAdminUser(strapi) {
  const ctx = strapi.requestContext.get();
  if (!ctx || ctx.state?.auth?.strategy?.name !== 'admin') {
    return null;
  }
  return ctx.state.user || null;
}

/**
 * Returns the documentIds of the sites the user is restricted to for the given
 * action and content type, or null if the user is unrestricted.
 */
async function getAllowedSiteDocumentIds(strapi, user, action, uid) {
  const roles = await strapi.db.query('admin::role').findMany({
    where: { users: { id: user.id } },
  });

  if (roles.length === 0 || roles.some((role) => role.code === 'strapi-super-admin')) {
    return null;
  }

  const permissions = await strapi.db.query('admin::permission').findMany({
    where: {
      role: { id: { $in: roles.map((role) => role.id) } },
      action: CONTENT_MANAGER_ACTIONS[action],
      subject: uid,
    },
  });

  // No permission at all: let the permission engine reject the request itself
  if (permissions.length === 0) {
    return null;
  }

  const siteDocumentIds = new Set();

  for (const permission of permissions) {
    const siteConditions = (permission.conditions || []).filter((name) =>
      name.startsWith(REGISTERED_CONDITION_PREFIX)
    );

    // At least one grant without a site condition: the user is unrestricted
    if (siteConditions.length === 0) {
      return null;
    }

    for (const name of siteConditions) {
      siteDocumentIds.add(name.slice(REGISTERED_CONDITION_PREFIX.length));
    }
  }

  return [...siteDocumentIds];
}

/**
 * Normalizes the various relation payload shapes (documentId, id,
 * { set: [...] }, { connect: [...] }) into the requested site's documentId.
 */
async function resolveRequestedSite(strapi, value) {
  const [candidate] = extractRelationCandidates(value);
  if (candidate === undefined) {
    return null;
  }

  const site = await strapi.db.query(SITE_UID).findOne({
    where: typeof candidate === 'number' ? { id: candidate } : { documentId: candidate },
  });

  return site ? site.documentId : null;
}

function extractRelationCandidates(value) {
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(extractRelationCandidates);
  }
  if (typeof value === 'object') {
    if (value.documentId !== undefined) {
      return [value.documentId];
    }
    if (value.id !== undefined) {
      return [value.id];
    }
    return extractRelationCandidates(value.set ?? value.connect);
  }
  return [];
}

module.exports = {
  registerSiteConditions,
  registerSiteScopeMiddleware,
};
