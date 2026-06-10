'use strict';

/**
 * listen-page router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::listen-page.listen-page');
