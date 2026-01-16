import { TableCards } from './_components/table-cards';
import { InsightCards } from './_components/insight-cards';
import { OverviewCards } from './_components/overview-cards';
import { OperationalCards } from './_components/operational-cards';

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <OverviewCards />
      <InsightCards />
      <OperationalCards />
      <TableCards />
    </div>
  );
}
