'use strict';

const { Op } = require('sequelize');
const { Appointment, Listing, User } = require('../models');

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'];

function buildInclude() {
  return [
    { model: Listing, as: 'listing' },
    { model: User, as: 'requester', attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'avatar_url', 'role'] },
    { model: User, as: 'agent', attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'avatar_url', 'role'] },
  ];
}

function canManageAppointment(req, appointment) {
  return req.user.role === 'admin' || appointment.agent_id === req.user.id;
}

async function createAppointment(req, res, next) {
  try {
    const { listing_id, scheduled_at, contact_phone, note } = req.body;

    const listing = await Listing.findByPk(listing_id);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    const when = new Date(scheduled_at);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ success: false, message: 'Date de rendez-vous invalide.' });
    }

    if (when <= new Date()) {
      return res.status(400).json({ success: false, message: 'La date du rendez-vous doit être dans le futur.' });
    }

    if (listing.user_id === req.user.id) {
      return res.status(403).json({ success: false, message: 'Le propriétaire de l’annonce ne peut pas créer un rendez-vous pour son propre bien.' });
    }

    const appointment = await Appointment.create({
      listing_id: listing.id,
      requester_id: req.user.id,
      agent_id: listing.user_id,
      scheduled_at: when,
      contact_phone: contact_phone || req.user.phone || null,
      note: note || null,
      status: 'pending',
    });

    const created = await Appointment.findByPk(appointment.id, { include: buildInclude() });
    res.status(201).json({ success: true, data: created, message: 'Rendez-vous créé avec succès.' });
  } catch (err) { next(err); }
}

async function getMyAppointments(req, res, next) {
  try {
    const where = req.user.role === 'admin'
      ? {}
      : {
          [Op.or]: [
            { requester_id: req.user.id },
            { agent_id: req.user.id },
          ],
        };

    const appointments = await Appointment.findAll({
      where,
      include: buildInclude(),
      order: [['scheduled_at', 'ASC']],
    });

    res.json({ success: true, data: appointments });
  } catch (err) { next(err); }
}

async function getAgentAppointments(req, res, next) {
  try {
    const where = req.user.role === 'admin' ? {} : { agent_id: req.user.id };

    const appointments = await Appointment.findAll({
      where,
      include: buildInclude(),
      order: [['scheduled_at', 'ASC']],
    });

    res.json({ success: true, data: appointments });
  } catch (err) { next(err); }
}

async function updateAppointmentStatus(req, res, next) {
  try {
    const appointment = await Appointment.findByPk(req.params.id, { include: buildInclude() });
    if (!appointment) return res.status(404).json({ success: false, message: 'Rendez-vous introuvable.' });

    if (!canManageAppointment(req, appointment)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.scheduled_at) {
      const when = new Date(req.body.scheduled_at);
      if (Number.isNaN(when.getTime())) {
        return res.status(400).json({ success: false, message: 'Date de rendez-vous invalide.' });
      }
      updates.scheduled_at = when;
    }
    if (req.body.agent_note !== undefined) updates.agent_note = req.body.agent_note;

    await appointment.update(updates);
    const refreshed = await Appointment.findByPk(appointment.id, { include: buildInclude() });

    res.json({ success: true, data: refreshed, message: 'Rendez-vous mis à jour.' });
  } catch (err) { next(err); }
}

async function cancelAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Rendez-vous introuvable.' });

    if (req.user.role !== 'admin' && appointment.requester_id !== req.user.id && appointment.agent_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    await appointment.update({ status: 'cancelled' });
    res.json({ success: true, message: 'Rendez-vous annulé.' });
  } catch (err) { next(err); }
}

module.exports = {
  createAppointment,
  getMyAppointments,
  getAgentAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  APPOINTMENT_STATUSES,
};