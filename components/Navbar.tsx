import { auth } from "@/auth";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const session = await auth();
  const isAdmin = Boolean(session?.user?.isAdmin);

  return <NavbarClient isAdmin={isAdmin} />;
}