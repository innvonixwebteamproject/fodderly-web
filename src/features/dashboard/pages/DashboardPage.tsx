import { Container } from "@/components/common/container";

export const DashboardPage = () => {
  return (
    <Container className="flex min-h-full flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Dashboard Overview</h1>
          {/* <p className="text-sm text-muted-foreground">Monitor your fodder ecosystem performance</p> */}
        </div>
      </div>
    </Container>
  );
};
