'use strict';

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

function parseNaturalSearch(message) {
  const text = String(message || '').toLowerCase();
  const filters = {};
  const priceMatch = text.match(/(?:moins de|max(?:imum)?|budget de)\s*([\d\s.,]+)\s*(?:dt|dinars)?/i);
  const roomsMatch = text.match(/(\d+)\s*(?:chambres?|pi[eè]ces?)/i);
  const surfaceMatch = text.match(/(?:au moins|minimum)\s*(\d+)\s*m[²2]/i);

  if (/location|louer|lou[eé]e|loyer/.test(text)) filters.transaction = 'Location';
  if (/vente|acheter|achat|vendre/.test(text)) filters.transaction = 'Vente';
  for (const [label, value] of [['appartement', 'Appartement'], ['villa', 'Villa'], ['maison', 'Maison'], ['bureau', 'Bureau'], ['terrain', 'Terrain'], ['garage', 'Garage']]) {
    if (text.includes(label)) { filters.property_type = value; break; }
  }
  if (priceMatch) {
    const price = parseFloat(priceMatch[1].replace(/[\s.]/g, '').replace(',', '.'));
    if (Number.isFinite(price)) filters.max_price = price;
  }
  if (roomsMatch) filters.rooms = parseInt(roomsMatch[1], 10);
  if (surfaceMatch) filters.min_surface = parseInt(surfaceMatch[1], 10);
  if (/meubl[eé]|meuble/.test(text)) filters.is_furnished = true;
  if (/parking|garage/.test(text)) filters.has_parking = true;
  if (/piscine/.test(text)) filters.has_pool = true;

  const cities = ['Tunis', 'Ariana', 'Ben Arous', 'La Marsa', 'Sousse', 'Sfax', 'Nabeul', 'Hammamet', 'Monastir', 'Bizerte', 'Djerba'];
  const city = cities.find((candidate) => text.includes(candidate.toLowerCase()));
  if (city) filters.city = city;
  return filters;
}

async function parseWithAi(message) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Extrait les filtres immobiliers tunisiens. Réponds uniquement en JSON avec transaction, property_type, city, governorate, min_price, max_price, min_surface, rooms, is_furnished, has_parking, has_pool. Omet les champs inconnus.' },
          { role: 'user', content: message },
        ],
        temperature: 0,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.choices?.[0]?.message?.content ? JSON.parse(data.choices[0].message.content) : null;
  } catch (error) {
    return null;
  }
}

async function naturalSearch(req, res, next) {
  try {
    const { message } = req.body || {};
    if (!message || String(message).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Décrivez votre recherche.' });
    }
    const aiFilters = await parseWithAi(String(message).trim());
    const filters = { ...parseNaturalSearch(message), ...(aiFilters || {}) };
    Object.keys(filters).forEach((key) => {
      if (filters[key] === '' || filters[key] === null || filters[key] === undefined) delete filters[key];
    });
    res.json({ success: true, data: { query: message, filters, mode: aiFilters ? 'ai' : 'rule' } });
  } catch (err) { next(err); }
}

/**
 * Recherche full-text via le vecteur GIN de PostgreSQL.
 * GET /api/search?q=appartement+tunis&...
 */
async function fullTextSearch(req, res, next) {
  try {
    const {
      q, page = 1, limit = 12,
      transaction, property_type, city, governorate,
      min_price, max_price, min_surface, max_surface,
      is_new, is_furnished, has_parking, has_pool,
      sort = 'relevance',
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Requête de recherche trop courte (min 2 caractères).' });
    }

    // Construire la query à la main pour profiter du ranking ts_rank
    const conditions = [`l.status = 'active'`];
    const params = [];
    let pIdx = 1;

    // Full-text
    const tsQuery = q.trim().split(/\s+/).join(' & ');
    conditions.push(`l.search_vector @@ plainto_tsquery('french', $${pIdx})`);
    params.push(q.trim()); pIdx++;

    if (transaction)   { conditions.push(`l.transaction   = $${pIdx}`); params.push(transaction); pIdx++; }
    if (property_type) { conditions.push(`l.property_type = $${pIdx}`); params.push(property_type); pIdx++; }
    if (city)          { conditions.push(`l.city ILIKE $${pIdx}`);       params.push(`%${city}%`); pIdx++; }
    if (governorate)   { conditions.push(`l.governorate ILIKE $${pIdx}`);params.push(`%${governorate}%`); pIdx++; }
    if (min_price)     { conditions.push(`l.price >= $${pIdx}`);          params.push(parseFloat(min_price)); pIdx++; }
    if (max_price)     { conditions.push(`l.price <= $${pIdx}`);          params.push(parseFloat(max_price)); pIdx++; }
    if (min_surface)   { conditions.push(`l.surface >= $${pIdx}`);        params.push(parseFloat(min_surface)); pIdx++; }
    if (max_surface)   { conditions.push(`l.surface <= $${pIdx}`);        params.push(parseFloat(max_surface)); pIdx++; }
    if (is_new === 'true')       conditions.push(`l.is_new = true`);
    if (is_furnished === 'true') conditions.push(`l.is_furnished = true`);
    if (has_parking === 'true')  conditions.push(`l.has_parking = true`);
    if (has_pool === 'true')     conditions.push(`l.has_pool = true`);

    const whereClause = conditions.join(' AND ');

    const orderClause = sort === 'price_asc'  ? 'l.price ASC'
                      : sort === 'price_desc' ? 'l.price DESC'
                      : sort === 'surface'    ? 'l.surface DESC NULLS LAST'
                      : `ts_rank(l.search_vector, plainto_tsquery('french', $1)) DESC, l.featured DESC`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const safeLimit = Math.min(parseInt(limit), 50);

    const countSql = `
      SELECT COUNT(*) FROM listings l
      WHERE ${whereClause}
    `;

    const dataSql = `
      SELECT
        l.id, l.title, l.slug, l.transaction, l.property_type,
        l.city, l.governorate, l.address, l.price, l.surface,
        l.rooms, l.bedrooms, l.bathrooms, l.is_new, l.is_furnished,
        l.has_parking, l.has_pool, l.latitude, l.longitude,
        l.views_count, l.featured, l.created_at,
        ts_rank(l.search_vector, plainto_tsquery('french', $1)) AS rank,
        u.first_name, u.last_name, u.phone AS owner_phone,
        img.url AS cover_url
      FROM listings l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN listing_images img ON img.listing_id = l.id AND img.is_cover = true
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    params.push(safeLimit, offset);

    const [countResult, listings] = await Promise.all([
      sequelize.query(countSql, { bind: params.slice(0, pIdx - 1), type: QueryTypes.SELECT }),
      sequelize.query(dataSql,  { bind: params, type: QueryTypes.SELECT }),
    ]);

    const total = parseInt(countResult[0].count);

    res.json({
      success: true,
      data: {
        query: q,
        listings,
        pagination: { total, page: parseInt(page), pages: Math.ceil(total / safeLimit), limit: safeLimit },
      },
    });
  } catch (err) { next(err); }
}

/**
 * Suggestions auto-complete rapide.
 * GET /api/search/suggest?q=tunis
 */
async function suggest(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    const results = await sequelize.query(`
      SELECT DISTINCT city, governorate FROM listings
      WHERE status = 'active' AND (
        city ILIKE :q OR governorate ILIKE :q OR address ILIKE :q OR title ILIKE :q
      )
      ORDER BY city LIMIT 8
    `, { replacements: { q: `%${q}%` }, type: QueryTypes.SELECT });

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
}

/**
 * Statistiques par ville pour la carte.
 * GET /api/search/map-stats
 */
async function mapStats(req, res, next) {
  try {
    const { transaction } = req.query;
    const where = transaction ? `AND l.transaction = '${transaction}'` : '';

    const stats = await sequelize.query(`
      SELECT
        l.city,
        l.governorate,
        COUNT(*)::int         AS count,
        AVG(l.price)::numeric AS avg_price,
        MIN(l.latitude)       AS lat,
        MIN(l.longitude)      AS lng
      FROM listings l
      WHERE l.status = 'active' AND l.latitude IS NOT NULL ${where}
      GROUP BY l.city, l.governorate
      ORDER BY count DESC
      LIMIT 30
    `, { type: QueryTypes.SELECT });

    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
}

module.exports = { fullTextSearch, naturalSearch, suggest, mapStats };
