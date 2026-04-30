export function AmbientGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute right-[-14rem] top-[-14rem] size-[54rem] rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-[12rem] left-[38%] size-[42rem] rounded-full bg-accent/5 blur-3xl" />
    </div>
  );
}
