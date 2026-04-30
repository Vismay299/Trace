import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function NotFound() {
  return (
    <div className="px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow className="justify-center">404 / Not found</Eyebrow>
        <h1 className="mt-8 text-5xl font-bold leading-tight text-text sm:text-6xl">
          This page did not ship.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-text-muted">
          The route is missing, stale, or still sitting in a draft branch
          somewhere.
        </p>
        <Button href="/" size="lg" className="mt-8">
          Back to Trace
        </Button>
      </div>
    </div>
  );
}
