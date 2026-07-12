import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}

export function useGoogleCalendarEvents(from: string, to: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["google-calendar-events", from, to],
    queryFn: async (): Promise<GoogleCalendarEvent[]> => {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/calendar/events?${params.toString()}`);
      if (!res.ok) throw new Error("구글 캘린더 조회 실패");
      return res.json();
    },
    enabled: status === "authenticated",
  });
}
