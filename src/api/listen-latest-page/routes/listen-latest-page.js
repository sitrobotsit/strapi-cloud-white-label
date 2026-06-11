'use strict';

/**
 * listen-latest-page router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::listen-latest-page.listen-latest-page');
