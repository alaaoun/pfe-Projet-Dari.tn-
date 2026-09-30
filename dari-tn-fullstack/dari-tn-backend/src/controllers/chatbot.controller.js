'use strict';

const { Op } = require('sequelize');
const { Listing, ListingImage } = require('../models');

function normalizeText(value = '') {
  return String(value).toLowerCase().trim();
}

function formatPrice(value, transaction) {
  if (value === null || value === undefined || value === '') return 'non communiqué';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `${num.toLocaleString('fr-FR')} ${transaction === 'Location' ? 'DT / mois' : 'DT'}`;
}

function buildContextSummary(listing = {}) {
  return `
  Bien: ${listing.title || 'Annonce immobilière'}
  Type: ${listing.property_type || 'non renseigné'}
  Ville: ${listing.city || 'non renseignée'}
  Gouvernorat: ${listing.governorate || 'non renseigné'}
  Transaction: ${listing.transaction || 'non renseignée'}
  Prix: ${formatPrice(listing.price, listing.transaction)}
  Surface: ${listing.surface ? `${listing.surface} m²` : 'non renseignée'}
  Pièces: ${listing.rooms || 'non renseignées'}
  Chambres: ${listing.bedrooms || 'non renseignées'}
  Salles de bain: ${listing.bathrooms || 'non renseignées'}
  Meublé: ${listing.is_furnished ? 'oui' : 'non'}
  Statut: ${listing.status || 'inconnu'}
  `;
}

function buildRuleReply(message, listing = {}) {
  const text = normalizeText(message);

  if (!text) return 'Dites-moi ce que vous souhaitez savoir sur ce bien.';

  if (/bonjour|salut|hello/.test(text)) {
    return `Bonjour ! Je peux vous aider sur l’annonce ${listing.title || 'de ce bien'}.`;
  }

  if (/prix|coût|cout|tarif|combien/.test(text)) {
    return `Le prix demandé est ${formatPrice(listing.price, listing.transaction)}.`;
  }

  if (/surface|m²|superficie|taille/.test(text)) {
    return listing.surface
      ? `La surface est de ${listing.surface} m².`
      : 'La surface n’est pas précisée dans l’annonce.';
  }

  if (/chambre|pièce|pieces|pièces|sdb|bain/.test(text)) {
    const rooms = listing.rooms ? `${listing.rooms} pièces` : 'plusieurs';
    const bedrooms = listing.bedrooms ? `${listing.bedrooms} chambres` : 'nombre non précisé';
    const baths = listing.bathrooms ? `${listing.bathrooms} salle(s) de bain` : 'nombre non précisé';
    return `Ce bien comprend ${rooms}, ${bedrooms} et ${baths}.`;
  }

  if (/disponible|disponibil|statut|actif/.test(text)) {
    return listing.status === 'active'
      ? 'Oui, cette annonce est actuellement active et disponible.'
      : `Le statut de l’annonce est : ${listing.status || 'inconnu'}.`;
  }

  if (/visite|rendez|rdv|date|prendre/.test(text)) {
    return 'Vous pouvez demander une visite directement dans le formulaire de visite situé dans cette fiche. Choisissez une date puis envoyez votre demande.';
  }

  if (/quartier|ville|localisation|adresse|emplacement/.test(text)) {
    if (listing.city && listing.governorate) {
      return `Le bien se trouve à ${listing.city}, ${listing.governorate}.`;
    }
    return listing.city ? `Le bien est situé à ${listing.city}.` : 'La localisation n’est pas précisée.';
  }

  if (/meubl|furni/.test(text)) {
    return listing.is_furnished ? 'Oui, le bien est meublé.' : 'Non, le bien n’est pas indiqué comme meublé.';
  }

  if (/merci/.test(text)) {
    return 'Avec plaisir. Je peux aussi vous aider à préparer une visite ou à clarifier un point du bien.';
  }

  return 'Je peux vous renseigner sur le prix, la localisation, la surface, la disponibilité et la demande de visite. Posez-moi une question précise.';
}

async function getAiReply(message, listing) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant immobilier sur une plateforme tunisienne. Réponds en français, concise et utile.',
          },
          {
            role: 'user',
            content: `Voici le contexte du bien:\n${buildContextSummary(listing)}\n\nQuestion: ${message}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim();
  } catch (err) {
    return null;
  }
}

async function getSimilarListings(listing = {}) {
  if (!listing.id && !listing.city && !listing.property_type) return [];

  const where = { status: 'active' };
  if (listing.id) where.id = { [Op.ne]: listing.id };
  if (listing.city) where.city = listing.city;
  if (listing.property_type) where.property_type = listing.property_type;
  if (listing.transaction) where.transaction = listing.transaction;

  const listings = await Listing.findAll({
    where,
    attributes: { exclude: ['search_vector'] },
    include: [{ model: ListingImage, as: 'images', where: { is_cover: true }, required: false, limit: 1 }],
    order: [['featured', 'DESC'], ['created_at', 'DESC']],
    limit: 4,
  });

  return listings.map((item) => item.toJSON());
}

async function chatWithAssistant(req, res, next) {
  try {
    const { message, listing } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Le message est requis.' });
    }

    const context = listing || {};
    const aiReply = await getAiReply(String(message), context);
    const reply = aiReply || buildRuleReply(String(message), listing || {});
    const recommendations = await getSimilarListings(context);

    res.json({
      success: true,
      data: {
        reply,
        mode: aiReply ? 'ai' : 'rule',
        recommendations,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { chatWithAssistant };
