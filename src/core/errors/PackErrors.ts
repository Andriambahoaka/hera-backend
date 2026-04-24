export class InvalidOwnerIdError extends Error {
  constructor() {
    super("Invalid ownerId");
    this.name = "InvalidOwnerIdError";
  }
}

export class OwnerNotFoundError extends Error {
  constructor() {
    super("Owner not found");
    this.name = "OwnerNotFoundError";
  }
}

export class InvalidOwnerTypeError extends Error {
  constructor() {
    super("Invalid owner type");
    this.name = "InvalidOwnerTypeError";
  }
}

export class DeviceAlreadyExistsError extends Error {
  constructor() {
    super("Device already exists");
    this.name = "DeviceAlreadyExistsError";
  }
}
