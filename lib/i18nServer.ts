import { cookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(localeCookieName)?.value;

  return isLocale(locale) ? locale : defaultLocale;
}
