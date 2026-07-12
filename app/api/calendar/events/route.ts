import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.googleAccessToken) {
    return NextResponse.json({ error: "구글 캘린더 연동 권한이 없습니다" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from, to가 필요합니다" }, { status: 400 });
  }

  // orderBy=startTime(오름차순)만 지원되는데, 기간이 넓으면(예: 2020~2027) 과거의
  // 반복 일정만으로 maxResults가 다 차서 최근 일정이 아예 안 올 수 있음 ->
  // maxResults를 최대치로 늘리고, 페이지가 더 있으면 이어서 가져옴
  const allItems: any[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin: new Date(from).toISOString(),
      timeMax: new Date(to).toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
      ...(pageToken ? { pageToken } : {}),
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${session.googleAccessToken}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "구글 캘린더 조회 실패", detail: text }, { status: res.status });
    }

    const data = await res.json();
    // Google Calendar API는 종일/시간 일정을 구분해서 조회하는 쿼리 파라미터를
    // 지원하지 않음(all-day 제외는 API 레벨에서 불가) -> 응답을 받는 즉시,
    // 페이지별로 누적하기 전에 최대한 빨리 걸러냄.
    // 단, 휴가(eventType: "outOfOffice")는 종일 일정이어도 가져옴
    const timed = (data.items ?? []).filter(
      (e: any) => e.start?.dateTime || e.eventType === "outOfOffice"
    );
    allItems.push(...timed);
    pageToken = data.nextPageToken;
  } while (pageToken);

  const myEmail = session.user?.email?.toLowerCase();

  const events = allItems
    .filter((e: any) => e.start && e.end)
    .map((e: any) => {
      const attendees = (e.attendees ?? []).map((a: any) => ({
        email: a.email,
        name: a.displayName,
        responseStatus: a.responseStatus,
        organizer: !!a.organizer,
      }));
      const me = attendees.find((a: any) => a.email?.toLowerCase() === myEmail);
      return {
        id: e.id,
        title: e.summary ?? "(제목 없음)",
        location: e.location ?? null,
        start: e.start.dateTime ?? e.start.date,
        end: e.end.dateTime ?? e.end.date,
        allDay: !e.start.dateTime,
        attendees,
        // 참석자 목록에 내가 없으면(예: 다른 사람 초대 없는 개인 일정) 수락 여부를 따질 필요가 없어 null
        myResponseStatus: me?.responseStatus ?? null,
      };
    })
    // 최신순으로 정렬해서 반환
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  return NextResponse.json(events);
}
