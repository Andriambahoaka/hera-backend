export interface DolynkResponse<T> {
  code: string;
  success: boolean;
  data: T;
  msg: string;
}

export interface AreaArmMode {
  areaId: number;
  mode: string;
}

export interface GetAreaArmModeData {
  armModes: AreaArmMode[];
}

export interface AccessoryInfo {
  accessoryInfos : [];
}

export interface AccessoryStatus {
  accessoryStatus : AreaArmMode[];
}

export interface GetPicCamSnapUrlData {
  picUrl: string;
}