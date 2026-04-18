import { backendFetch } from "./backend";
import type { PostWithVariants } from "./types";

export async function listPostsWithVariants(): Promise<PostWithVariants[]> {
  const res = await backendFetch("/posts");
  if (!res.ok) throw new Error(`Backend /posts ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { posts: PostWithVariants[] };
  return data.posts ?? [];
}

export async function getPostWithVariants(
  id: string,
): Promise<PostWithVariants | null> {
  const res = await backendFetch(`/posts/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Backend /posts/${id} ${res.status}: ${await res.text()}`);
  return (await res.json()) as PostWithVariants;
}
