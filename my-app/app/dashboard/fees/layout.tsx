import FeesNav from "@/components/fees/fees-nav";

export default function FeesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl">
      <FeesNav />
      {children}
    </div>
  );
}
