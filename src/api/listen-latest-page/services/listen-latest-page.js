'use strict';

/**
 * listen-latest-page service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::listen-latest-page.listen-latest-page');
