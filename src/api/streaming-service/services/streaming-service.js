'use strict';

/**
 * streaming-service service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::streaming-service.streaming-service');
