import { Card } from "../common/Card";

export function ExpirySummaryCards({
  summary,
}: {
  summary: { expired: number; today: number; next3Days: number; thisWeek: number; safe: number };
}) {
  const cards = [
    { label: "Expired", value: summary.expired, color: "text-red-700 bg-red-50" },
    { label: "Today", value: summary.today, color: "text-orange-700 bg-orange-50" },
    { label: "Next 3 Days", value: summary.next3Days, color: "text-amber-700 bg-amber-50" },
    { label: "This Week", value: summary.thisWeek, color: "text-yellow-700 bg-yellow-50" },
    { label: "Safe Stock", value: summary.safe, color: "text-emerald-700 bg-emerald-50" },
  ];

  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
      {cards.map((card) => (
        <Card key={card.label} className="min-w-28 p-3 shadow-none">
          <div className={`mb-2 inline-flex rounded-full px-2 py-1 text-xs font-bold ${card.color}`}>
            {card.value}
          </div>
          <p className="text-sm font-semibold text-kitchen-ink">{card.label}</p>
        </Card>
      ))}
    </div>
  );
}
