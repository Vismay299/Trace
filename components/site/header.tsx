import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/site/logo";
import { MobileMenu } from "@/components/site/mobile-menu";
import { NavLinks } from "@/components/site/nav-links";
import { auth } from "@/lib/auth";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const authed = Boolean(user);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/82 backdrop-blur-xl">
      <div
        className={
          authed
            ? "mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto] items-center px-5 xl:grid-cols-[1fr_auto_1fr] lg:px-8"
            : "mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto] items-center px-5 md:grid-cols-[1fr_auto_1fr] lg:px-8"
        }
      >
        <Logo />
        <NavLinks authenticated={authed} />
        {authed ? (
          <div className="hidden justify-end gap-3 xl:flex">
            <Button href="/settings" variant="ghost" className="whitespace-nowrap">
              {user?.name || user?.email || "Account"}
            </Button>
            <SignOutButton className="whitespace-nowrap" />
          </div>
        ) : (
          <div className="hidden justify-end gap-3 md:flex">
            <Button href="/login" variant="link" className="whitespace-nowrap">
              Sign in
            </Button>
            <Button href="/signup" variant="ghost" className="whitespace-nowrap">
              Create account
            </Button>
          </div>
        )}
        <div className={authed ? "flex justify-end xl:hidden" : "flex justify-end md:hidden"}>
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  );
}
