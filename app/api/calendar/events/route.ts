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

  const params = new URLSearchParams({
    timeMin: new Date(from).toISOString(),
    timeMax: new Date(to).toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
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
  const events = (data.items ?? [])
    .filter((e: any) => e.start && e.end)
    .map((e: any) => ({
      id: e.id,
      title: e.summary ?? "(제목 없음)",
      start: e.start.dateTime ?? e.start.date,
      end: e.end.dateTime ?? e.end.date,
      allDay: !e.start.dateTime,
    }));

  return NextResponse.json(events);
}
