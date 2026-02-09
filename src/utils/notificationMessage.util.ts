export const getMessageTitleFromMsgType = (msgType: string): string => {
  switch (msgType) {
    case 'AlarmLocal':
      return 'Intrusion détectée !';
    case 'armed':
      return "Activation de l'alarme";
    case 'disarmed':
      return "Désactivation de l'alarme";
    case 'online':
      return "Allumage de l'alarme";
    case 'offline':
      return "Extinction de l'alarme";
    case 'SensorAbnormal':
      return 'Autoprotection déclenchée';
    default:
      return 'Hera';
  }
};

export const getMessageBodyFromMsgType = (
  msgType: string,
  packName: string,
  userName?: string
): string => {
  const messages: Record<string, string> = {
    AlarmLocal: `Votre détecteur vient de se déclencher et de prendre une photo à "${packName}"`,
    armed: `Votre centrale dans "${packName}" vient d'être armée par "${userName}"`,
    disarmed: `Votre centrale dans "${packName}" vient d'être désarmée par "${userName}"`,
    online: `Votre centrale dans "${packName}" vient d'être allumée`,
    offline: `Votre centrale dans "${packName}" vient d'être éteinte`,
    SensorAbnormal: `Une tentative d'altération d'un accessoire a été détectée à "${packName}"`,
  };

  return messages[msgType] || `Nouvelle notification reçue : "${msgType}"`;
};
