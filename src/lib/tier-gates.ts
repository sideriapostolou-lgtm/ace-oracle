import { cookies } from "next/headers";

export function hasAccess(): boolean {
  try {
    const cookieStore = cookies();
    const accessCookie = cookieStore.get("ace_access");
    return accessCookie?.value === "granted";
  } catch {
    return false;
  }
}
