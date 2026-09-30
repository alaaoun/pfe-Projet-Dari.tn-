'use strict';

const { sequelize, Sequelize } = require('../config/database');
const { DataTypes } = Sequelize;

// ─── USER ─────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  first_name:    { type: DataTypes.STRING(100), allowNull: false },
  last_name:     { type: DataTypes.STRING(100), allowNull: false },
  email:         { type: DataTypes.STRING(255), allowNull: false, unique: true },
  phone:         { type: DataTypes.STRING(30) },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role:          { type: DataTypes.ENUM('user', 'agent', 'admin'), defaultValue: 'user' },
  avatar_url:    { type: DataTypes.TEXT },
  is_verified:   { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login_at: { type: DataTypes.DATE },
}, { tableName: 'users' });

// ─── LISTING ──────────────────────────────────────────────────
const Listing = sequelize.define('Listing', {
  id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:           { type: DataTypes.UUID, allowNull: false },
  title:             { type: DataTypes.STRING(255), allowNull: false },
  slug:              { type: DataTypes.STRING(300), allowNull: false, unique: true },
  description:       { type: DataTypes.TEXT },
  transaction:       { type: DataTypes.ENUM('Vente', 'Location'), allowNull: false },
  property_type:     { type: DataTypes.ENUM('Appartement','Villa','Maison','Bureau','Terrain','Garage','Local commercial','Ferme'), allowNull: false },
  city:              { type: DataTypes.STRING(100), allowNull: false },
  governorate:       { type: DataTypes.STRING(100), allowNull: false },
  address:           { type: DataTypes.STRING(255) },
  zip_code:          { type: DataTypes.STRING(10) },
  latitude:          { type: DataTypes.DECIMAL(10, 8) },
  longitude:         { type: DataTypes.DECIMAL(11, 8) },
  price:             { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  price_negotiable:  { type: DataTypes.BOOLEAN, defaultValue: false },
  surface:           { type: DataTypes.DECIMAL(10, 2) },
  rooms:             { type: DataTypes.SMALLINT },
  bedrooms:          { type: DataTypes.SMALLINT },
  bathrooms:         { type: DataTypes.SMALLINT },
  floor:             { type: DataTypes.SMALLINT },
  total_floors:      { type: DataTypes.SMALLINT },
  construction_year: { type: DataTypes.SMALLINT },
  is_new:            { type: DataTypes.BOOLEAN, defaultValue: false },
  is_furnished:      { type: DataTypes.BOOLEAN, defaultValue: false },
  has_parking:       { type: DataTypes.BOOLEAN, defaultValue: false },
  has_elevator:      { type: DataTypes.BOOLEAN, defaultValue: false },
  has_pool:          { type: DataTypes.BOOLEAN, defaultValue: false },
  has_garden:        { type: DataTypes.BOOLEAN, defaultValue: false },
  has_terrace:       { type: DataTypes.BOOLEAN, defaultValue: false },
  has_ac:            { type: DataTypes.BOOLEAN, defaultValue: false },
  has_heating:       { type: DataTypes.BOOLEAN, defaultValue: false },
  status:            { type: DataTypes.ENUM('active','pending','sold','rented','archived'), defaultValue: 'active' },
  views_count:       { type: DataTypes.INTEGER, defaultValue: 0 },
  featured:          { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'listings' });

// ─── LISTING IMAGE ────────────────────────────────────────────
const ListingImage = sequelize.define('ListingImage', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  listing_id: { type: DataTypes.UUID, allowNull: false },
  url:        { type: DataTypes.TEXT, allowNull: false },
  public_id:  { type: DataTypes.STRING(255) },
  is_cover:   { type: DataTypes.BOOLEAN, defaultValue: false },
  position:   { type: DataTypes.SMALLINT, defaultValue: 0 },
}, { tableName: 'listing_images', updatedAt: false });

// ─── FAVORITE ─────────────────────────────────────────────────
const Favorite = sequelize.define('Favorite', {
  user_id:    { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  listing_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
}, { tableName: 'favorites', updatedAt: false });

// ─── MESSAGE ──────────────────────────────────────────────────
const Message = sequelize.define('Message', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  listing_id:   { type: DataTypes.UUID, allowNull: false },
  sender_name:  { type: DataTypes.STRING(200), allowNull: false },
  sender_email: { type: DataTypes.STRING(255), allowNull: false },
  sender_phone: { type: DataTypes.STRING(30) },
  body:         { type: DataTypes.TEXT, allowNull: false },
  is_read:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'messages', updatedAt: false });

// ─── REFRESH TOKEN ────────────────────────────────────────────
const RefreshToken = sequelize.define('RefreshToken', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:    { type: DataTypes.UUID, allowNull: false },
  token:      { type: DataTypes.TEXT, allowNull: false, unique: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'refresh_tokens', updatedAt: false });

// ─── APPOINTMENT ─────────────────────────────────────────────
const Appointment = sequelize.define('Appointment', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  listing_id:    { type: DataTypes.UUID, allowNull: false },
  requester_id:  { type: DataTypes.UUID, allowNull: false },
  agent_id:      { type: DataTypes.UUID, allowNull: false },
  scheduled_at:  { type: DataTypes.DATE, allowNull: false },
  status:        { type: DataTypes.ENUM('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'), defaultValue: 'pending' },
  contact_phone: { type: DataTypes.STRING(30) },
  note:          { type: DataTypes.TEXT },
  agent_note:    { type: DataTypes.TEXT },
  payment_status: { type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
  payment_provider: { type: DataTypes.STRING(30) },
  payment_provider_id: { type: DataTypes.STRING(120) },
  visit_fee_amount: { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 20 },
}, { tableName: 'appointments' });

// ─── ASSOCIATIONS ─────────────────────────────────────────────
User.hasMany(Listing, { foreignKey: 'user_id', as: 'listings' });
Listing.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

Listing.hasMany(ListingImage, { foreignKey: 'listing_id', as: 'images' });
ListingImage.belongsTo(Listing, { foreignKey: 'listing_id' });

Listing.hasMany(Message, { foreignKey: 'listing_id', as: 'messages' });
Message.belongsTo(Listing, { foreignKey: 'listing_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Appointment, { foreignKey: 'requester_id', as: 'requestedAppointments' });
User.hasMany(Appointment, { foreignKey: 'agent_id', as: 'assignedAppointments' });
Appointment.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });
Appointment.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });
Appointment.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });
Listing.hasMany(Appointment, { foreignKey: 'listing_id', as: 'appointments' });

// Favoris M:N
User.belongsToMany(Listing, { through: Favorite, foreignKey: 'user_id', as: 'favoriteListings' });
Listing.belongsToMany(User, { through: Favorite, foreignKey: 'listing_id', as: 'favoritedBy' });

module.exports = { User, Listing, ListingImage, Favorite, Message, RefreshToken, Appointment, sequelize };
