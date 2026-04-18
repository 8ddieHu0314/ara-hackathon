export type Platform = "linkedin" | "x" | "reddit";

export type VariantStatus =
  | "draft"
  | "posting"
  | "posted"
  | "failed"
  | "mocked";

export type Post = {
  id: string;
  original_text: string;
  created_at: string;
};

export type PostVariant = {
  id: string;
  post_id: string;
  platform: Platform;
  content: string;
  status: VariantStatus;
  platform_post_url: string | null;
  error: string | null;
  posted_at: string | null;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
};

export type PostWithVariants = Post & { variants: PostVariant[] };
