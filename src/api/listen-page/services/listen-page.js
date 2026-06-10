'use strict';

/**
 * listen-page service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::listen-page.listen-page');
