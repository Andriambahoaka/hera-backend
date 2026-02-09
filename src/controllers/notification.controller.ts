import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export const postNotification = async (req: Request, res: Response) => {
  try {
    const result = await NotificationService.createAndSendNotification(req.body);

    res.status(201).json({
      message: 'Notification créée et envoyée',
      notification: result.notification,
      fcmResponse: result.fcmResponse,
    });
  } catch (error: any) {
    switch (error.message) {
      case 'PACK_NOT_FOUND':
        return res.status(404).json({ error: 'Pack introuvable.' });
      case 'USER_OR_TOKEN_NOT_FOUND':
        return res.status(404).json({ error: 'Utilisateur ou tokens introuvables.' });
      default:
        return res.status(500).json({
          error: 'Échec lors de la création ou de l’envoi de la notification',
          details: error.message,
        });
    }
  }
};

export const findAllByOwner = async (req: Request<{ ownerId: string }>, res: Response) => {
  try {
    const data = await NotificationService.findAllByOwner(req.params.ownerId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
