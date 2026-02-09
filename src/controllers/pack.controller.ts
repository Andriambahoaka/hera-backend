import { Request, Response,NextFunction } from 'express';
import { PackService } from '../services/pack.service';
import * as ResponseHandler from '../utils/responseHandler';
import { PackErrors } from '../errors';
import { ERRORS } from '../utils/messages.util';


const handleAddPackError = (res: Response, error: any) => {
  if (error instanceof PackErrors.InvalidOwnerIdError) {
    return ResponseHandler.sendBadRequestError(res, ERRORS.INVALID_OWNER_ID);
  }
  if (error instanceof PackErrors.OwnerNotFoundError) {
    return ResponseHandler.sendNotFoundError(res, ERRORS.OWNER_NOT_FOUND);
  }
  if (error instanceof PackErrors.InvalidOwnerTypeError) {
    return ResponseHandler.sendForbiddenError(res, ERRORS.INVALID_OWNER_TYPE);
  }
  if (error instanceof PackErrors.DeviceAlreadyExistsError) {
    return ResponseHandler.sendBadRequestError(res, ERRORS.DEVICE_ALREADY_EXISTS);
  }
  return ResponseHandler.sendInternalError(res, error);
}


export const addPack = async (req: Request, res: Response) => {
  try {
    const pack = await PackService.createPack(req.body);
    ResponseHandler.sendCreated(res, pack, 'Pack added successfully');
  } catch (error: any) {
    return handleAddPackError(res, error);
  }
};

export const updateDeviceNames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await PackService.updateDeviceNames(req.body.updates);
    return ResponseHandler.sendCreated(res, null, "Device names updated");
  } catch (error) {
    next(error); // delegate to global error middleware
  }
};

export const editUrgencyNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pack = await PackService.updateUrgencyNumber(req.body.deviceId, req.body.urgencyNumber);
    if (!pack) return ResponseHandler.sendNotFoundError(res, "Pack not found");
    return ResponseHandler.sendSuccess(res, pack);
  } catch (error) {
    next(error);
  }
};

export const findByDeviceId = async (req: Request<{ deviceId: string }>, res: Response, next: NextFunction) => {
  try {
    const pack = await PackService.findByDeviceId(req.params.deviceId);
    if (!pack) return ResponseHandler.sendNotFoundError(res, "Pack not found");
    return ResponseHandler.sendSuccess(res, pack);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId, ...fields } = req.body;
    const pack = await PackService.updatePack(deviceId, fields);
    return ResponseHandler.sendSuccess(res, pack);
  } catch (error) {
    next(error);
  }
};

export const findAll = async (_: Request, res: Response, next: NextFunction) => {
  try {
    const packs = await PackService.findAll();
    return ResponseHandler.sendSuccess(res, packs);
  } catch (error) {
    next(error);
  }
};

export const findAllByOwner = async (req: Request<{ ownerId: string }>, res: Response, next: NextFunction) => {
  try {
    const packs = await PackService.findAllByOwner(req.params.ownerId);
    return ResponseHandler.sendSuccess(res, packs);
  } catch (error) {
    next(error);
  }
};

export const addOrUpdatePackAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await PackService.addOrUpdatePackAccess(req.body);
    return ResponseHandler.sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
};

export const findAllPackAccessByUser = async (req: Request<{ userId: string }>, res: Response, next: NextFunction) => {
  try {
    const accessList = await PackService.findAllPackAccessByUser(req.params.userId);
    return ResponseHandler.sendSuccess(res, accessList);
  } catch (error) {
    next(error);
  }
};
