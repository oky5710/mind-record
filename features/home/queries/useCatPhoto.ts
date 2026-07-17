import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const MAX_PAGE = 10;

interface PixabayResponse {
  hits: { largeImageURL: string }[];
}

async function fetchCatPhoto(page: number, index: number): Promise<string> {
  const params = new URLSearchParams({
    key: process.env.NEXT_PUBLIC_PIXABAY_API_KEY!,
    q: "cat",
    image_type: "photo",
    per_page: "200",
    page: String(page),
  });
  const res = await fetch(`https://pixabay.com/api/?${params}`);
  if (!res.ok) throw new Error("Failed to fetch cat photo");
  const data: PixabayResponse = await res.json();
  if (!data.hits.length) throw new Error("No images found");
  return data.hits[index % data.hits.length].largeImageURL;
}

export function useCatPhoto() {
  // 마운트 시 한 번만 생성되는 랜덤 값
  const { page, index } = useMemo(() => ({
    page: Math.floor(Math.random() * MAX_PAGE) + 1,
    index: Math.floor(Math.random() * 200),
  }), []);

  return useQuery({
    queryKey: ["cat-photo", page, index],
    queryFn: () => fetchCatPhoto(page, index),
    staleTime: Infinity,
    retry: 2,
  });
}
