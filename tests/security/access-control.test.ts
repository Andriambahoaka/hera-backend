/**
 * Security regression checklist for the upcoming phases.
 *
 * Each `it.todo` becomes a real test in the phase that fixes it, so
 * `npm test` shows what is still open. Access rules agreed with the product owner:
 *   Level 1 (Basic):    arm/disarm, read arm state, instant capture, accessory info/status
 *   Level 2 (Standard): level 1 + notifications (incl. law-enforcement alerts)
 *   Level 3 (Admin):    level 2 + settings
 *   Members management: userType OWNER or ADMIN only
 *   Activities:         everyone; members only see activity for devices they can access
 *   Owners are implicitly level 3 on their own devices.
 */

// Phase 2 (endpoints without authentication) is covered by
// tests/integration/{devices,webhook,closed-endpoints}.test.ts.

describe("Phase 3: tokens", () => {
  it.todo("a refresh token cannot be used as an access token");
  it.todo("an access token cannot be used to reset a password");
  it.todo("a reset token works only once");
  it.todo("changing the password invalidates existing tokens");
});

describe("Phase 4: device access levels", () => {
  it.todo("set-area-arm: rejects a user with no access to the device");
  it.todo("set-area-arm: allows level 1");
  it.todo("get-area-arm: allows level 1");
  it.todo("get-screenshot-url: allows level 1");
  it.todo("get-accessories-info / get-accessory-status: allow level 1");
  it.todo("set-accessory: rejects level 2, allows level 3");
  it.todo("GET /api/notifications: level 1 sees nothing, level 2 sees device notifications");
  it.todo("push notifications are sent only to owner and level >= 2 users");
  it.todo("POST /api/packs/access: cannot grant a level above one's own");
  it.todo("POST /api/packs/access: cannot target a user outside the household");
});

describe("Phase 4: household management", () => {
  it.todo("add-member: only OWNER or ADMIN userType, ownerId taken from the caller, not the body");
  it.todo("update-member: only OWNER or ADMIN, same household, allow-listed fields only");
  it.todo("update-member: cannot change email, password, ownerId, or promote to OWNER");
  it.todo("DELETE /api/users/:id: only OWNER or ADMIN, same household, cannot delete the owner");
  it.todo("GET /api/activities: members only see armed/disarmed activity for accessible devices");
  it.todo("GET /api/users/members never returns password hashes or device tokens");
});

describe("Phase 5: data integrity", () => {
  it.todo("logout removes the device token");
  it.todo("deleting an owner removes members, devices, accesses, activities and notifications");
  it.todo("deleting a device removes its access records");
  it.todo("image upload rejects files over 2MB and non-images");
  it.todo("operator injection in email fields is rejected");
});
