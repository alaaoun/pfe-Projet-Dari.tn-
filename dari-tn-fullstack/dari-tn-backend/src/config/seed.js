'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('./database');
const logger = require('../utils/logger');

async function seed() {
  let t;
  try {
    const seedPasswords = {
      admin: process.env.SEED_ADMIN_PASSWORD,
      agent: process.env.SEED_AGENT_PASSWORD,
      user: process.env.SEED_USER_PASSWORD,
    };
    const missingPasswords = Object.entries(seedPasswords)
      .filter(([, password]) => !password)
      .map(([role]) => `SEED_${role.toUpperCase()}_PASSWORD`);
    if (missingPasswords.length > 0) {
      throw new Error(`Variables de seed manquantes : ${missingPasswords.join(', ')}`);
    }

    t = await sequelize.transaction();
    // Admin
    const adminId = uuidv4();
    const adminHash = await bcrypt.hash(seedPasswords.admin, 12);
    await sequelize.query(`
      INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, is_verified)
      VALUES (:id, 'Admin', 'Dari', 'admin@dari.tn', '+216 71 000 000', :hash, 'admin', true)
      ON CONFLICT (email) DO NOTHING
    `, { replacements: { id: adminId, hash: adminHash }, transaction: t });

    // Agent demo
    const agentId = uuidv4();
    const agentHash = await bcrypt.hash(seedPasswords.agent, 12);
    await sequelize.query(`
      INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, is_verified)
      VALUES (:id, 'Ahmed', 'Ben Ali', 'agent@dari.tn', '+216 22 111 222', :hash, 'agent', true)
      ON CONFLICT (email) DO NOTHING
    `, { replacements: { id: agentId, hash: agentHash }, transaction: t });

    // User demo
    const userId = uuidv4();
    const userHash = await bcrypt.hash(seedPasswords.user, 12);
    await sequelize.query(`
      INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, is_verified)
      VALUES (:id, 'Sami', 'Trabelsi', 'user@dari.tn', '+216 55 123 456', :hash, 'user', true)
      ON CONFLICT (email) DO NOTHING
    `, { replacements: { id: userId, hash: userHash }, transaction: t });

    const [adminRecord] = await sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@dari.tn'",
      { type: QueryTypes.SELECT, transaction: t }
    );
    const actualAdminId = adminRecord?.id || adminId;

    const [agentRecord] = await sequelize.query(
      "SELECT id FROM users WHERE email = 'agent@dari.tn'",
      { type: QueryTypes.SELECT, transaction: t }
    );
    const actualAgentId = agentRecord?.id || agentId;

    const [userRecord] = await sequelize.query(
      "SELECT id FROM users WHERE email = 'user@dari.tn'",
      { type: QueryTypes.SELECT, transaction: t }
    );
    const actualUserId = userRecord?.id || userId;

    // Annonces demo
    const listings = [
      {
        id: uuidv4(), userId: agentId,
        title: 'Appartement S+3 vue mer La Marsa',
        slug: 'appartement-s3-vue-mer-la-marsa',
        desc: 'Magnifique appartement S+3 avec vue panoramique sur la mer Méditerranée. Cuisine équipée, double vitrage, résidence sécurisée avec piscine et gardien 24h/24.',
        trans: 'Vente', type: 'Appartement', city: 'La Marsa', gov: 'Tunis',
        addr: 'Corniche La Marsa', price: 450000, surface: 130, rooms: 4, beds: 3, baths: 2,
        isNew: true, hasPark: true, hasElev: true, hasPool: true, lat: 36.8825, lng: 10.3238,
      },
      {
        id: uuidv4(), userId: agentId,
        title: 'Villa avec piscine Carthage',
        slug: 'villa-piscine-carthage',
        desc: 'Villa somptueuse dans le quartier historique de Carthage. Jardins paysagés 800m², piscine chauffée, dépendances, vue imprenable sur le Golfe de Tunis.',
        trans: 'Vente', type: 'Villa', city: 'Carthage', gov: 'Tunis',
        addr: 'Byrsa, Carthage', price: 1200000, surface: 350, rooms: 7, beds: 5, baths: 4,
        isNew: false, furnished: true, hasPark: true, hasPool: true, hasGarden: true, lat: 36.8590, lng: 10.3233,
      },
      {
        id: uuidv4(), userId: agentId,
        title: 'Appartement S+2 meublé Belvédère',
        slug: 'appartement-s2-meuble-belvedere',
        desc: 'Bel appartement meublé au cœur de Tunis, proche de toutes les commodités. Cuisine entièrement équipée, WiFi inclus.',
        trans: 'Location', type: 'Appartement', city: 'Tunis', gov: 'Tunis',
        addr: 'Belvédère', price: 1800, surface: 85, rooms: 3, beds: 2, baths: 1,
        furnished: true, hasElev: true, lat: 36.8225, lng: 10.1772,
      },
      {
        id: uuidv4(), userId: agentId,
        title: 'Bureau 200m² Berges du Lac 2',
        slug: 'bureau-200m2-berges-du-lac-2',
        desc: 'Plateau de bureaux open-space dans une tour moderne. Climatisation centrale, fibre optique, salle de réunion, parking souterrain.',
        trans: 'Location', type: 'Bureau', city: 'Tunis', gov: 'Tunis',
        addr: 'Les Berges du Lac 2', price: 4500, surface: 200, rooms: 6, baths: 2,
        isNew: true, hasPark: true, hasElev: true, lat: 36.8385, lng: 10.2347,
      },
      {
        id: uuidv4(), userId: agentId,
        title: 'Terrain constructible bord de mer Hammamet',
        slug: 'terrain-constructible-bord-de-mer-hammamet',
        desc: 'Terrain plat de 1200m² en première ligne, zone touristique nord de Hammamet. COS 1.2, titre bleu, toutes autorisations disponibles.',
        trans: 'Vente', type: 'Terrain', city: 'Hammamet', gov: 'Nabeul',
        addr: 'Zone touristique nord', price: 320000, surface: 1200, lat: 36.4021, lng: 10.6156,
      },
      {
        id: uuidv4(), userId: agentId,
        title: 'Appartement neuf S+1 Sahloul',
        slug: 'appartement-neuf-s1-sahloul-sousse',
        desc: 'Programme neuf livraison 2025. Finitions haut de gamme, immeuble sécurisé, proche universités et commerces de Sousse.',
        trans: 'Vente', type: 'Appartement', city: 'Sousse', gov: 'Sousse',
        addr: 'Sahloul 3', price: 185000, surface: 68, rooms: 2, beds: 1, baths: 1,
        isNew: true, hasPark: true, hasElev: true, lat: 35.8522, lng: 10.5901,
      },
      {
        id: uuidv4(), userId: agentId,
        title: 'Villa moderne résidence fermée Nabeul',
        slug: 'villa-moderne-residence-fermee-nabeul',
        desc: 'Villa contemporaine dans résidence fermée. Matériaux premium, domotique, jardin 400m², double garage.',
        trans: 'Vente', type: 'Villa', city: 'Nabeul', gov: 'Nabeul',
        addr: 'Résidence les Pins', price: 680000, surface: 280, rooms: 6, beds: 4, baths: 3,
        isNew: true, hasPark: true, hasGarden: true, hasAc: true, lat: 36.4561, lng: 10.7376,
      },
      {
        id: uuidv4(), userId: agentId,
        title: 'Studio meublé centre-ville Sfax',
        slug: 'studio-meuble-centre-ville-sfax',
        desc: 'Studio entièrement meublé et équipé, tout confort. Idéal pour étudiants ou professionnels. Charges incluses.',
        trans: 'Location', type: 'Appartement', city: 'Sfax', gov: 'Sfax',
        addr: 'Centre-ville', price: 650, surface: 35, rooms: 1, beds: 1, baths: 1,
        furnished: true, lat: 34.7401, lng: 10.7601,
      },
    ];

    for (const l of listings) {
      await sequelize.query(`
        INSERT INTO listings (
          id, user_id, title, slug, description, transaction, property_type,
          city, governorate, address, price, surface, rooms, bedrooms, bathrooms,
          is_new, is_furnished, has_parking, has_elevator, has_pool, has_garden,
          has_ac, latitude, longitude, status
        ) VALUES (
          :id, :userId, :title, :slug, :desc, :trans::transaction_type, :type::property_type,
          :city, :gov, :addr, :price, :surface, :rooms, :beds, :baths,
          :isNew, :furnished, :hasPark, :hasElev, :hasPool, :hasGarden,
          :hasAc, :lat, :lng, 'active'
        ) ON CONFLICT (slug) DO NOTHING
      `, {
        replacements: {
          id: l.id, userId: l.userId, title: l.title, slug: l.slug, desc: l.desc || null,
          trans: l.trans, type: l.type, city: l.city, gov: l.gov, addr: l.addr || null,
          price: l.price, surface: l.surface || null, rooms: l.rooms || null,
          beds: l.beds || null, baths: l.baths || null,
          isNew: l.isNew || false, furnished: l.furnished || false,
          hasPark: l.hasPark || false, hasElev: l.hasElev || false,
          hasPool: l.hasPool || false, hasGarden: l.hasGarden || false,
          hasAc: l.hasAc || false, lat: l.lat || null, lng: l.lng || null,
        },
        transaction: t,
      });
    }

    const slugReplacements = Object.fromEntries(listings.map((l, i) => [`slug${i}`, l.slug]));
    const slugParams = listings.map((_, i) => `:slug${i}`).join(', ');
    const listingRows = await sequelize.query(
      `SELECT id, slug FROM listings WHERE slug IN (${slugParams})`,
      { replacements: slugReplacements, type: QueryTypes.SELECT, transaction: t }
    );
    const listingMap = Object.fromEntries(listingRows.map((row) => [row.slug, row.id]));

    const appointments = [
      {
        id: uuidv4(),
        listingId: listingMap[listings[0].slug],
        requesterId: actualUserId,
        agentId: actualAgentId,
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        contactPhone: '+216 55 123 456',
        note: 'Je souhaite visiter ce bien la semaine prochaine, si possible le matin.',
      },
      {
        id: uuidv4(),
        listingId: listingMap[listings[1].slug],
        requesterId: actualAdminId,
        agentId: actualAgentId,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'confirmed',
        contactPhone: '+216 71 000 000',
        note: 'Visite confirmée pour le client, merci de préparer les documents.',
      },
      {
        id: uuidv4(),
        listingId: listingMap[listings[2].slug],
        requesterId: actualUserId,
        agentId: actualAgentId,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'rescheduled',
        contactPhone: '+216 55 123 456',
        note: 'Demande de report de visite en fin de mois.',
      },
      {
        id: uuidv4(),
        listingId: listingMap[listings[3].slug],
        requesterId: actualUserId,
        agentId: actualAgentId,
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'cancelled',
        contactPhone: '+216 55 123 456',
        note: 'Visite annulée parce que le bien n’est plus disponible.',
      },
    ];

    for (const a of appointments) {
      await sequelize.query(`
        INSERT INTO appointments (
          id, listing_id, requester_id, agent_id, scheduled_at, status, contact_phone, note
        ) VALUES (
          :id, :listingId, :requesterId, :agentId, :scheduledAt, :status::appointment_status, :contactPhone, :note
        ) ON CONFLICT (id) DO NOTHING
      `, {
        replacements: a,
        transaction: t,
      });
    }

    await t.commit();
    logger.info('✅ Seed terminé — données initiales insérées.');
  } catch (err) {
    if (t) await t.rollback();
    console.error('❌ Erreur seed :', err);
    console.error(err.stack);
    logger.error('❌ Erreur seed :', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
