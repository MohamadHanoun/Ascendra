import { auth } from "@/auth";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const session = await auth();

  return (
    <NavbarClient
      isAdmin={Boolean(session?.user?.isAdmin)}
      isLoggedIn={Boolean(session?.user)}
      userName={session?.user?.name || null}
      userImage={session?.user?.image || null}
    />
  );
}
