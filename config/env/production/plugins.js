// Strapi Cloud only exposes custom environment variables after the build
// step, so the email provider must be configured in this env-specific file
// rather than in the base config/plugins.js.
// See: https://docs.strapi.io/cloud/advanced/email
module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'strapi-provider-email-resend',
      providerOptions: {
        apiKey: env('RESEND_API_KEY'),
      },
      settings: {
        defaultFrom: env('RESEND_DEFAULT_FROM'),
        defaultReplyTo: env('RESEND_DEFAULT_REPLY_TO'),
      },
    },
  },
});
