import Navigation from "@/features/shared/components/Navigation";
import Calendar from "./Calendar";

export default function CalendarView() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 max-w-md mx-auto w-full px-2 py-3">
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <Calendar />
        </div>
      </div>
    </div>
  );
}
