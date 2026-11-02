import { useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { homeSections, homeSectionHref } from "@/lib/homeNavigation";
import { ROUTES } from "@/lib/routes";

export function MarketingHeader() {
  const followedSection = useRef(false);
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 md:px-6">
        <Link
          to={ROUTES.home}
          aria-label="DeliveryPilot home"
          className="min-w-0 text-lg font-bold tracking-tight"
        >
          Delivery<span className="text-primary">Pilot</span>
        </Link>
        <nav
          aria-label="Homepage sections"
          className="hidden items-center gap-6 lg:flex"
        >
          {homeSections.map((section) => (
            <a
              key={section.id}
              href={homeSectionHref(section.id)}
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to={ROUTES.signIn}>Sign in</Link>
          </Button>
          <Button asChild className="hidden md:inline-flex">
            <Link to={ROUTES.signUp}>Get started</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 lg:hidden"
              >
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent
              onCloseAutoFocus={(event) => {
                // Preserve native anchor focus instead of returning to the sticky menu.
                if (followedSection.current) {
                  event.preventDefault();
                  followedSection.current = false;
                }
              }}
            >
              <SheetHeader>
                <SheetTitle>Explore DeliveryPilot</SheetTitle>
                <SheetDescription>
                  Explore the product direction or open the interface preview.
                </SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Mobile homepage navigation"
                className="flex flex-col gap-2 px-4"
              >
                {homeSections.map((section) => (
                  <SheetClose asChild key={section.id}>
                    <a
                      href={homeSectionHref(section.id)}
                      onClick={() => {
                        followedSection.current = true;
                      }}
                      className="flex min-h-11 items-center rounded-md px-3 text-base font-medium hover:bg-accent"
                    >
                      {section.label}
                    </a>
                  </SheetClose>
                ))}
                <Separator className="my-2" />
                <SheetClose asChild>
                  <Button asChild>
                    <Link to={ROUTES.signUp}>Get started</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="outline">
                    <Link to={ROUTES.signIn}>Sign in</Link>
                  </Button>
                </SheetClose>
                <p className="py-2 text-sm leading-relaxed text-muted-foreground">
                  Product preview. Authentication and delivery workflows are not
                  connected.
                </p>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
