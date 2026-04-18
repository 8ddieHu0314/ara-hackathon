import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Post, PostVariant, PostWithVariants } from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

type Store = {
  posts: Post[];
  variants: PostVariant[];
};

let lock: Promise<void> = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = lock.then(fn, fn);
  lock = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function read(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      variants: Array.isArray(parsed.variants) ? parsed.variants : [],
    };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { posts: [], variants: [] };
    }
    throw e;
  }
}

async function write(data: Store): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, STORE_PATH);
}

export type NewVariant = Omit<PostVariant, "id" | "post_id">;

export async function createPostWithVariants(
  originalText: string,
  variants: NewVariant[],
): Promise<PostWithVariants> {
  return withLock(async () => {
    const data = await read();
    const post: Post = {
      id: randomUUID(),
      original_text: originalText,
      created_at: new Date().toISOString(),
    };
    const materialized: PostVariant[] = variants.map((v) => ({
      id: randomUUID(),
      post_id: post.id,
      ...v,
    }));
    data.posts.unshift(post);
    data.variants.push(...materialized);
    await write(data);
    return { ...post, variants: materialized };
  });
}

export async function listPostsWithVariants(): Promise<PostWithVariants[]> {
  const data = await read();
  const posts = [...data.posts].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
  return posts.map((p) => ({
    ...p,
    variants: data.variants.filter((v) => v.post_id === p.id),
  }));
}

export async function getPostWithVariants(
  id: string,
): Promise<PostWithVariants | null> {
  const data = await read();
  const post = data.posts.find((p) => p.id === id);
  if (!post) return null;
  return {
    ...post,
    variants: data.variants.filter((v) => v.post_id === id),
  };
}
