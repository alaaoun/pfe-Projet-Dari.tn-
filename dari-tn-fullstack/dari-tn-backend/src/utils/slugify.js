'use strict';

const slugifyLib = require('slugify');
const { Listing } = require('../models');

async function generateUniqueSlug(title) {
  let slug = slugifyLib(title, { lower: true, strict: true, locale: 'fr' });
  let counter = 0;
  let candidate = slug;

  while (true) {
    const exists = await Listing.findOne({ where: { slug: candidate } });
    if (!exists) return candidate;
    counter++;
    candidate = `${slug}-${counter}`;
  }
}

module.exports = { generateUniqueSlug };
