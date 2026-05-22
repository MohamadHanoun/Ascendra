import { auth } from "@/auth";
import NavbarClient from "@/components/NavbarClient";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";

export default async function Navbar() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const dictionary = getDictionary(locale);

  return (
    <NavbarClient
      locale={locale}
      labels={dictionary.navbar}
      isAdmin={Boolean(session?.user?.isAdmin)}
      isLoggedIn={Boolean(session?.user)}
      userName={session?.user?.name || null}
      userImage={session?.user?.image || null}
    />
  );
}
