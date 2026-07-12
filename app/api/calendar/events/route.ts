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
    allItems.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  const events = allItems
    .filter((e: any) => e.start && e.end)
    .map((e: any) => ({
      id: e.id,
      title: e.summary ?? "(제목 없음)",
      start: e.start.dateTime ?? e.start.date,
      end: e.end.dateTime ?? e.end.date,
      allDay: !e.start.dateTime,
    }))
    // 최신순으로 정렬해서 반환
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  return NextResponse.json(events);
}
