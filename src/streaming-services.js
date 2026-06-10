'use strict';

const STREAMING_SERVICE_UID = 'api::streaming-service.streaming-service';

// The default set list of streaming services. Admins can extend the list at
// any time by adding entries in the Content Manager; entries are matched by
// slug, so existing (or renamed) entries are never overwritten or duplicated.
const DEFAULT_STREAMING_SERVICES = [
  { name: 'Bandcamp', slug: 'bandcamp' },
  { name: 'Spotify', slug: 'spotify' },
  { name: 'Tidal', slug: 'tidal' },
  { name: 'Apple Music', slug: 'apple-music' },
  { name: 'iTunes Store', slug: 'itunes-store' },
  { name: 'Deezer', slug: 'deezer' },
  { name: 'Amazon Music', slug: 'amazon-music' },
  { name: 'YouTube Music', slug: 'youtube-music' },
  { name: 'Qobuz', slug: 'qobuz' },
  { name: 'Pandora', slug: 'pandora' },
  { name: 'Soundcloud', slug: 'soundcloud' },
];

/**
 * Creates any default streaming services that don't exist yet.
 * Safe to run on every startup (local and Strapi Cloud).
 */
async function seedStreamingServices(strapi) {
  for (const service of DEFAULT_STREAMING_SERVICES) {
    const existing = await strapi.db.query(STREAMING_SERVICE_UID).findOne({
      where: { slug: service.slug },
    });

    if (!existing) {
      await strapi.documents(STREAMING_SERVICE_UID).create({ data: service });
      strapi.log.info(`Created streaming service: ${service.name}`);
    }
  }
}

module.exports = {
  seedStreamingServices,
};
