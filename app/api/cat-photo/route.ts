const PIXABAY_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

interface PixabayImage {
  id: number;
  largeImageURL: string;
}

interface PixabayResponse {
  hits: PixabayImage[];
}

export async function GET(request: Request) {
  if (!PIXABAY_KEY) {
    return Response.json({ error: "PIXABAY_API_KEY not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const index = Number(searchParams.get("index") ?? 0);

  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", PIXABAY_KEY);
  url.searchParams.set("q", "cat");
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("per_page", "200");
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString());
  if (!res.ok) {
    return Response.json({ error: "Pixabay fetch failed" }, { status: 502 });
  }

  const data: PixabayResponse = await res.json();
  if (!data.hits.length) {
    return Response.json({ error: "No images found" }, { status: 404 });
  }

  const image = data.hits[index % data.hits.length];
  return Response.json({ url: image.largeImageURL });
}
