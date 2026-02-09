import { Request, Response } from "express";
import Activity from "../models/activity.model";

/**
 * Controller to handle activity-related operations.
 * @module controllers/activity.controller
 */

/**
 * Add a new activity to the database.
 *
 * @param {Request} req - the HTTP request containing the activity data in the body.
 * @param {Response} res - the HTTP response to send the result.
 * @returns {Promise<void>} - A promise that resolves when the activity is added.
 */
export const addActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId, content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Le contenu de l'activité est requis." });
      return;
    }

    const newActivity = new Activity({
      ownerId,
      content,
    });

    const savedActivity = await newActivity.save();

    res.status(201).json({
      message: "Activité ajoutée avec succès.",
      activity: savedActivity,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};

/**
 * Find activities by date and owner.
 *
 * @param {Request} req - the HTTP request containing the date and ownerId as query parameters.
 * @param {Response} res - the HTTP response to send the result.
 * @returns {Promise<void>} - A promise that resolves when the activities are retrieved.
 */
export const findActivitiesByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, ownerId } = req.query;

    if (!ownerId) {
      res.status(400).json({ error: 'Le paramètre "ownerId" est requis.' });
      return;
    }

    let activities;

    if (date) {
      activities = await (Activity as any).findByDateAndOwner(date, ownerId);
    } else {
      activities = await Activity.find({ ownerId }).sort({ createdAt: -1 });
    }

    res.status(200).json(activities);
  } catch (error: any) {
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};
