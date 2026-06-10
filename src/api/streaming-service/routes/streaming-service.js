'use strict';

/**
 * streaming-service router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::streaming-service.streaming-service');
