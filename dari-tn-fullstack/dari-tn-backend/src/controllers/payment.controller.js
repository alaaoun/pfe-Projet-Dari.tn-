'use strict';

const { Appointment, Listing } = require('../models');

const FLOUCI_URL = 'https://developers.flouci.com/api/generate_payment';
const FLOUCI_VERIFY_URL = 'https://developers.flouci.com/api/verify_payment';

function config() {
  return {
    appToken: process.env.FLOUCI_APP_TOKEN,
    appSecret: process.env.FLOUCI_APP_SECRET,
    backendUrl: process.env.BACKEND_PUBLIC_URL,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    amount: Number(process.env.APPOINTMENT_FEE_TND || 20),
  };
}

function flouciHeaders(settings) {
  return {
    'Content-Type': 'application/json',
    app_token: settings.appToken,
    app_secret: settings.appSecret,
  };
}

async function createAppointmentPayment(req, res, next) {
  let appointment;
  try {
    const settings = config();
    const missingSettings = [
      ['FLOUCI_APP_TOKEN', settings.appToken],
      ['FLOUCI_APP_SECRET', settings.appSecret],
      ['BACKEND_PUBLIC_URL', settings.backendUrl],
    ].filter(([, value]) => !value).map(([name]) => name);
    if (missingSettings.length > 0) {
      return res.status(503).json({
        success: false,
        message: `Configuration Flouci incomplète. Variables manquantes : ${missingSettings.join(', ')}.`,
      });
    }

    const { listing_id, scheduled_at, contact_phone, note } = req.body;
    const listing = await Listing.findByPk(listing_id);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    const when = new Date(scheduled_at);
    if (Number.isNaN(when.getTime()) || when <= new Date()) {
      return res.status(400).json({ success: false, message: 'La date du rendez-vous doit être valide et dans le futur.' });
    }
    if (listing.user_id === req.user.id) {
      return res.status(403).json({ success: false, message: 'Le propriétaire ne peut pas réserver une visite de son propre bien.' });
    }

    appointment = await Appointment.create({
      listing_id: listing.id,
      requester_id: req.user.id,
      agent_id: listing.user_id,
      scheduled_at: when,
      contact_phone: contact_phone || req.user.phone || null,
      note: note || null,
      status: 'pending',
      payment_status: 'pending',
      payment_provider: 'flouci',
      visit_fee_amount: settings.amount,
    });

    const response = await fetch(FLOUCI_URL, {
      method: 'POST',
      headers: flouciHeaders(settings),
      body: JSON.stringify({
        amount: Math.round(settings.amount * 1000),
        accept_card: true,
        developer_tracking_id: appointment.id,
        success_link: `${settings.backendUrl}/api/payments/flouci/callback`,
        fail_link: `${settings.backendUrl}/api/payments/flouci/callback`,
      }),
    });
    const result = await response.json();
    const paymentId = result?.result?.payment_id || result?.payment_id;
    const paymentUrl = result?.result?.link || result?.result?.payment_url || result?.payment_url;
    if (!response.ok || !paymentId || !paymentUrl) {
      await appointment.destroy();
      return res.status(502).json({ success: false, message: 'Flouci n’a pas pu créer le paiement.' });
    }

    await appointment.update({ payment_provider_id: paymentId });
    return res.status(201).json({ success: true, data: { payment_url: paymentUrl } });
  } catch (err) {
    if (appointment) await appointment.destroy().catch(() => {});
    next(err);
  }
}

async function flouciCallback(req, res, next) {
  try {
    const settings = config();
    const paymentId = req.query.payment_id || req.query.id;
    const appointment = paymentId
      ? await Appointment.findOne({ where: { payment_provider_id: paymentId, payment_provider: 'flouci' } })
      : null;

    if (!appointment || !paymentId) {
      return res.redirect(`${settings.frontendUrl}/rendez-vous?payment=failed`);
    }

    const response = await fetch(`${FLOUCI_VERIFY_URL}/${encodeURIComponent(paymentId)}`, {
      headers: flouciHeaders(settings),
    });
    const result = await response.json();
    const paymentState = String(result?.result?.status || result?.status || '').toLowerCase();
    const paid = response.ok && ['success', 'successful', 'paid', 'completed'].includes(paymentState);

    await appointment.update({ payment_status: paid ? 'paid' : 'failed' });
    return res.redirect(`${settings.frontendUrl}/rendez-vous?payment=${paid ? 'success' : 'failed'}`);
  } catch (err) { next(err); }
}

module.exports = { createAppointmentPayment, flouciCallback };