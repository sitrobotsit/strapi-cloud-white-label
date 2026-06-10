'use strict';

const seedExampleApp = require('./bootstrap');
const { registerSiteConditions, registerSiteScopeMiddleware } = require('./multi-site');
const { seedStreamingServices } = require('./streaming-services');

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    registerSiteScopeMiddleware(strapi);
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    await seedExampleApp();
    await seedStreamingServices(strapi);
    await registerSiteConditions(strapi);
  },
};
