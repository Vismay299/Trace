import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { MobileMenu } from "@/components/site/mobile-menu";
import { NavLinks } from "@/components/site/nav-links";
import { auth } from "@/lib/auth";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/82 backdrop-blur-xl">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto] items-center px-5 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Logo />
        <NavLinks authenticated={Boolean(user)} />
        <div className="hidden justify-end gap-3 md:flex">
          {user ? (
            <Button href="/dashboard" variant="ghost">
              {user.name || user.email || "Dashboard"}
            </Button>
          ) : (
            <>
              <Button href="/login" variant="link">
                Sign in
              </Button>
              <Button href="/signup" variant="ghost">
                Create account
              </Button>
            </>
          )}
        </div>
        <div className="flex justify-end md:hidden">
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  );
}
