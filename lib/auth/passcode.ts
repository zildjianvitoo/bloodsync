const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE;
const VOLUNTEER_PASSCODE = process.env.VOLUNTEER_PASSCODE;

export type UserRole = "admin" | "volunteer";

export function validatePasscode(role: UserRole, passcode: string) {
  if (!passcode) return false;
  if (role === "admin") {
    return ADMIN_PASSCODE ? passcode === ADMIN_PASSCODE : false;
  }
  return VOLUNTEER_PASSCODE ? passcode === VOLUNTEER_PASSCODE : false;
}

export function describeRole(role: UserRole) {
  return role === "admin" ? "Admin" : "Volunteer";
}
