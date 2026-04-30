import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { MobileMenu } from "@/components/site/mobile-menu";
import { NavLinks } from "@/components/site/nav-links";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/82 backdrop-blur-xl">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto] items-center px-5 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Logo />
        <NavLinks />
        <div className="hidden justify-end md:flex">
          <Button href="/waitlist" variant="ghost">
            Join Waitlist
          </Button>
        </div>
        <div className="flex justify-end md:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
