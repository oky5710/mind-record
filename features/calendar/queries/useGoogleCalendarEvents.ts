import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
    // from/to가 넓어질 때 데이터가 잠깐 비어서(undefined) 차트 너비가 흔들리고
    // 그로 인해 스크롤 위치가 다시 끝으로 튕기며 무한 확장되는 걸 방지
    placeholderData: keepPreviousData,
  });
}
