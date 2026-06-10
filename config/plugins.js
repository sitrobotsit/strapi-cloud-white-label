module.exports = ({ env }) => ({
  // Without a Resend API key (e.g. local dev), keep Strapi's default
  // sendmail provider; production config lives in config/env/production.
  ...(env('RESEND_API_KEY')
    ? {
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
      }
    : {}),
});
