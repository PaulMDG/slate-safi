import type { Tables } from "@/integrations/supabase/types";

export type Film = Tables<"films">;
export type FilmSummary = Pick<
  Film,
  | "id"
  | "slug"
  | "title"
  | "tagline"
  | "logline"
  | "status"
  | "release_year"
  | "runtime_minutes"
  | "genre"
  | "language"
  | "poster_url"
  | "hero_image_url"
  | "featured"
  | "sort_order"
>;

export type FilmCredit = Pick<
  Tables<"film_credits">,
  "id" | "name" | "role" | "credit_type" | "character_name" | "photo_url"
>;

export type GalleryImage = Pick<Tables<"film_gallery">, "id" | "image_url" | "caption">;

export type PressItem = Pick<
  Tables<"press_items">,
  "id" | "kind" | "title" | "outlet" | "quote" | "year"
>;

export type Post = Tables<"posts">;
export type PostSummary = Pick<
  Post,
  "id" | "slug" | "title" | "excerpt" | "cover_image_url" | "author" | "category" | "published_at"
>;

export type FilmDetail = {
  film: Film;
  credits: FilmCredit[];
  gallery: GalleryImage[];
  press: PressItem[];
};
