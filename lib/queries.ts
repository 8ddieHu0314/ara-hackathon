import { getSupabaseAdmin } from "./supabase";
import type { Post, PostVariant, PostWithVariants } from "./types";

export async function listPostsWithVariants(): Promise<PostWithVariants[]> {
  const supabase = getSupabaseAdmin();
  const { data: posts, error: pErr } = await supabase
    .from("posts")
    .select("id, original_text, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (pErr) throw new Error(pErr.message);
  if (!posts || posts.length === 0) return [];

  const { data: variants, error: vErr } = await supabase
    .from("post_variants")
    .select("*")
    .in(
      "post_id",
      posts.map((p) => p.id),
    );
  if (vErr) throw new Error(vErr.message);

  const byPost = new Map<string, PostVariant[]>();
  for (const v of (variants ?? []) as PostVariant[]) {
    const arr = byPost.get(v.post_id) ?? [];
    arr.push(v);
    byPost.set(v.post_id, arr);
  }

  return (posts as Post[]).map((p) => ({
    ...p,
    variants: byPost.get(p.id) ?? [],
  }));
}

export async function getPostWithVariants(
  id: string,
): Promise<PostWithVariants | null> {
  const supabase = getSupabaseAdmin();
  const { data: post, error: pErr } = await supabase
    .from("posts")
    .select("id, original_text, created_at")
    .eq("id", id)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!post) return null;
  const { data: variants, error: vErr } = await supabase
    .from("post_variants")
    .select("*")
    .eq("post_id", id);
  if (vErr) throw new Error(vErr.message);
  return { ...(post as Post), variants: (variants ?? []) as PostVariant[] };
}
