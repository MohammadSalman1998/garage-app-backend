const Garage = require('../models/Garage');
const GarageImage = require('../models/GarageImage');
const AuditLog = require('../models/AuditLog');

const createGarage = async (req, res) => {
  const { name, address, governorate, latitude, longitude, total_capacity, hourly_rate, floors_number, working_hours, cancellation_policy, min_booking_hours, cancellation_fee } = req.body;

  try {
    const garage_id = await Garage.create({
      manager_id: req.user.user_id,
      name,
      address,
      governorate,
      latitude,
      longitude,
      total_capacity,
      hourly_rate,
      floors_number,
      working_hours,
      cancellation_policy,
      min_booking_hours,
      cancellation_fee
    });

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'Garage created',
      entity_type: 'garage',
      entity_id: garage_id,
      details: { name, created_by: req.user.user_id }
    });

    res.status(201).json({ message: 'Garage created successfully', garage_id });
  } catch (error) {
    throw error;
  }
};

const addGarageImage = async (req, res) => {
  const { garage_id, image_url } = req.body;

  try {
    const image_id = await GarageImage.create({ garage_id, image_url });

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'Garage image added',
      entity_type: 'garage_image',
      entity_id: image_id,
      details: { garage_id, image_url, created_by: req.user.user_id }
    });

    res.status(201).json({ message: 'Garage image added successfully', image_id });
  } catch (error) {
    throw error;
  }
};

const getGarages = async (req, res) => {
  try {
    const garages = await Garage.getAll();
    res.json(garages);
  } catch (error) {
    throw error;
  }
};

const updateGarage = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    await Garage.update(id, updates);

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'Garage updated',
      entity_type: 'garage',
      entity_id: id,
      details: { updated_by: req.user.user_id }
    });

    res.json({ message: 'Garage updated successfully' });
  } catch (error) {
    throw error;
  }
};

const deleteGarage = async (req, res) => {
  const { id } = req.params;

  try {
    await Garage.delete(id);

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'Garage deleted',
      entity_type: 'garage',
      entity_id: id,
      details: { deleted_by: req.user.user_id }
    });

    res.json({ message: 'Garage deleted successfully' });
  } catch (error) {
    throw error;
  }
};

module.exports = { createGarage, addGarageImage, getGarages, updateGarage, deleteGarage };