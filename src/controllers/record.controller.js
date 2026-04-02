const recordService = require('../services/record.service');
const ApiResponse = require('../utils/ApiResponse');

const createRecord = async (req, res, next) => {
  try {
    const record = await recordService.createRecord(req.body, req.user._id);
    return ApiResponse.created(res, 'Financial record created.', { record });
  } catch (error) {
    next(error);
  }
};

const getRecords = async (req, res, next) => {
  try {
    const result = await recordService.getRecords(req.query);
    return ApiResponse.ok(res, 'Records retrieved.', result);
  } catch (error) {
    next(error);
  }
};

const getRecordById = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id);
    return ApiResponse.ok(res, 'Record retrieved.', { record });
  } catch (error) {
    next(error);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body);
    return ApiResponse.ok(res, 'Record updated.', { record });
  } catch (error) {
    next(error);
  }
};

const deleteRecord = async (req, res, next) => {
  try {
    const result = await recordService.deleteRecord(req.params.id);
    return ApiResponse.ok(res, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = { createRecord, getRecords, getRecordById, updateRecord, deleteRecord };
