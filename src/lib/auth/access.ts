export type MembershipStatus = "pending_email" | "pending_approval" | "active" | "rejected" | "suspended" | "withdrawal_requested" | "deleted";
export type Role = "member" | "admin" | "super_admin";
export function accessDestination(status: string | null, roles: string[], requirement: Role): string | null {
 if (status === "rejected") return "/account/rejected";
 if (status === "suspended" || status === "deleted") return "/account/suspended";
 if (status !== "active") return "/pending";
 if (requirement === "super_admin" && !roles.includes("super_admin")) return "/forbidden";
 if (requirement === "admin" && !roles.some(role => role === "admin" || role === "super_admin")) return "/forbidden";
 return null;
}
