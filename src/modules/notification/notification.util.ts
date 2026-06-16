import { NotificationType } from "./enums/notificationType.enum";

export const getMessageTitleFromMsgType = (msgType: string): string => {
  switch (msgType) {
    case NotificationType.ALARM_LOCAL:
      return "Intrusion détectée !";
    case NotificationType.ARMED:
      return "Activation de l'alarme";
    case NotificationType.DISARMED:
      return "Désactivation de l'alarme";
    case NotificationType.ONLINE:
      return "Allumage de l'alarme";
    case NotificationType.OFFLINE:
      return "Extinction de l'alarme";
    case NotificationType.SENSOR_ABNORMAL:
      return "Autoprotection déclenchée";
    default:
      return "Hera"; 
  }
};

export const getMessageBodyFromMsgType = (
  msgType: string,
  packName: string,
  userName?: string
): string => {
  const endingMessage = userName != null ? `par ${userName}` : `avec succès`;

  switch (msgType) {
    case NotificationType.ALARM_LOCAL:
      return `Votre détecteur vient de se déclencher et de prendre une photo à ${packName}.`;

    case NotificationType.ARMED:
      return `Votre centrale dans ${packName} vient d'être armée ${endingMessage}.`;

    case NotificationType.DISARMED:
      return `Votre centrale dans ${packName} vient d'être désarmée ${endingMessage}.`;

    case NotificationType.ONLINE:
      return `Votre centrale dans ${packName} vient d'être allumée.`;

    case NotificationType.OFFLINE:
      return `Votre centrale dans ${packName} vient d'être éteinte.`;

    case NotificationType.SENSOR_ABNORMAL:
      return `Une tentative d'altération d'un accessoire a été détectée à ${packName}.`;

    default:
      return `Nouvelle notification reçue : ${msgType}`;
  }
};

export const getNotificationContent = (
  msgType: string,
  packName: string,
  userName?: string
) => {
  return {
    title: getMessageTitleFromMsgType(msgType),
    body: getMessageBodyFromMsgType(msgType, packName, userName),
  };
};