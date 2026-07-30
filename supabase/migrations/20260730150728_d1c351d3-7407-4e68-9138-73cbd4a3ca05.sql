CREATE TABLE public.films (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  tagline text,
  logline text,
  synopsis text,
  status text NOT NULL DEFAULT 'upcoming',
  release_year integer,
  runtime_minutes integer,
  genre text,
  country text DEFAULT 'Kenya',
  language text,
  poster_url text,
  hero_image_url text,
  trailer_url text,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.films TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.films TO authenticated;
GRANT ALL ON public.films TO service_role;
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published films are public" ON public.films FOR SELECT TO anon USING (published = true);
CREATE POLICY "Team can manage films" ON public.films FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.film_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id uuid NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  credit_type text NOT NULL DEFAULT 'cast',
  character_name text,
  photo_url text,
  bio text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.film_credits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.film_credits TO authenticated;
GRANT ALL ON public.film_credits TO service_role;
ALTER TABLE public.film_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Credits are public" ON public.film_credits FOR SELECT TO anon USING (true);
CREATE POLICY "Team can manage credits" ON public.film_credits FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.film_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id uuid NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.film_gallery TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.film_gallery TO authenticated;
GRANT ALL ON public.film_gallery TO service_role;
ALTER TABLE public.film_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery is public" ON public.film_gallery FOR SELECT TO anon USING (true);
CREATE POLICY "Team can manage gallery" ON public.film_gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text,
  cover_image_url text,
  author text,
  category text DEFAULT 'News',
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are public" ON public.posts FOR SELECT TO anon USING (published = true);
CREATE POLICY "Team can manage posts" ON public.posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.press_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id uuid REFERENCES public.films(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'laurel',
  title text NOT NULL,
  outlet text,
  quote text,
  year integer,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.press_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_items TO authenticated;
GRANT ALL ON public.press_items TO service_role;
ALTER TABLE public.press_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published press items are public" ON public.press_items FOR SELECT TO anon USING (published = true);
CREATE POLICY "Team can manage press items" ON public.press_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  organisation text,
  inquiry_type text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_submissions TO anon;
GRANT SELECT, INSERT ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an enquiry" ON public.contact_submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can submit an enquiry" ON public.contact_submissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can read enquiries" ON public.contact_submissions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can subscribe" ON public.newsletter_subscribers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER films_updated_at BEFORE UPDATE ON public.films FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.films (slug, title, tagline, logline, synopsis, status, release_year, runtime_minutes, genre, language, hero_image_url, poster_url, trailer_url, featured, sort_order)
VALUES
('boda-love', 'Boda Love', 'Every ride is a risk. Every stop is a choice.',
 'A Nairobi boda boda rider falls for a passenger he ferries across the city each dawn — until the route he knows by heart leads somewhere he cannot come back from.',
 E'Kevo has ridden the same Nairobi corridor for six years: Kawangware to the CBD, before the traffic thickens and the light turns hard. Then Amina starts booking the 6:15 ride.\n\nWhat begins as a transaction becomes a daily hour of honesty between two people who cannot afford the lives they want. When Amina''s brother pulls Kevo into a courier job that pays too well, the city Kevo thought he had memorised begins to reveal its other face.\n\nShot across Nairobi over eleven weeks with a majority-Kenyan crew, Boda Love is a tender, propulsive love story about movement, class and the cost of standing still.',
 'released', 2024, 104, 'Romantic Drama', 'Swahili, Sheng, English',
 '/images/boda-love-hero.jpg', '/images/boda-love-hero.jpg', 'https://www.youtube.com/embed/aqz-KE-bpKQ', true, 1),
('kibera-hustle', 'Kibera Hustle', 'The city was built on their backs. Now they want the blueprint.',
 'Four young entrepreneurs in Kibera build a delivery network that outruns the city''s biggest logistics firm — and discover exactly how far power will go to protect itself.',
 E'In one of Africa''s most densely populated neighbourhoods, a former mechanic, a hairdresser, a coder and a fifteen-year-old runner assemble something the city said was impossible: a delivery network faster, cheaper and more trusted than anything downtown money can buy.\n\nKibera Hustle follows their first year — the improvised technology, the loyalty, the near-collapses — as a multinational logistics firm moves from imitation to acquisition to something uglier.\n\nCurrently in post-production, Kibera Hustle is Slate Safi''s most ambitious production to date, developed with support from partners in Nairobi, London and Toronto.',
 'upcoming', 2026, 118, 'Drama / Thriller', 'Swahili, Sheng, English',
 '/images/kibera-hustle-hero.jpg', '/images/kibera-hustle-hero.jpg', 'https://www.youtube.com/embed/aqz-KE-bpKQ', true, 2);

INSERT INTO public.film_credits (film_id, name, role, credit_type, character_name, sort_order)
SELECT f.id, v.name, v.role, v.credit_type, v.character_name, v.sort_order
FROM public.films f, (VALUES
  ('Achieng Otieno', 'Lead Actor', 'cast', 'Amina', 1),
  ('Brian Mwangi', 'Lead Actor', 'cast', 'Kevo', 2),
  ('Njeri Kamau', 'Supporting Actor', 'cast', 'Mama Zippy', 3),
  ('Tafari Okoth', 'Supporting Actor', 'cast', 'Juma', 4),
  ('Wanjiru Mbatia', 'Director', 'crew', NULL, 1),
  ('Samuel Ochieng', 'Producer', 'crew', NULL, 2),
  ('Lena Kariuki', 'Director of Photography', 'crew', NULL, 3),
  ('Dennis Rotich', 'Editor', 'crew', NULL, 4),
  ('Amara Diallo', 'Composer', 'crew', NULL, 5)
) AS v(name, role, credit_type, character_name, sort_order)
WHERE f.slug = 'boda-love';

INSERT INTO public.film_credits (film_id, name, role, credit_type, character_name, sort_order)
SELECT f.id, v.name, v.role, v.credit_type, v.character_name, v.sort_order
FROM public.films f, (VALUES
  ('Kevin Odhiambo', 'Lead Actor', 'cast', 'Shiko', 1),
  ('Faith Wairimu', 'Lead Actor', 'cast', 'Neema', 2),
  ('Collins Barasa', 'Supporting Actor', 'cast', 'Dan', 3),
  ('Wanjiru Mbatia', 'Director', 'crew', NULL, 1),
  ('Samuel Ochieng', 'Producer', 'crew', NULL, 2),
  ('Priya Shah', 'Executive Producer', 'crew', NULL, 3),
  ('Lena Kariuki', 'Director of Photography', 'crew', NULL, 4)
) AS v(name, role, credit_type, character_name, sort_order)
WHERE f.slug = 'kibera-hustle';

INSERT INTO public.film_gallery (film_id, image_url, caption, sort_order)
SELECT f.id, v.image_url, v.caption, v.sort_order
FROM public.films f, (VALUES
  ('/images/boda-love-hero.jpg', 'Dawn on Ngong Road', 1),
  ('/images/kibera-hustle-hero.jpg', 'Rooftops at last light', 2),
  ('/images/slate-safi-crew.jpg', 'On set with the crew', 3)
) AS v(image_url, caption, sort_order)
WHERE f.slug = 'boda-love';

INSERT INTO public.film_gallery (film_id, image_url, caption, sort_order)
SELECT f.id, v.image_url, v.caption, v.sort_order
FROM public.films f, (VALUES
  ('/images/kibera-hustle-hero.jpg', 'Principal photography, Nairobi', 1),
  ('/images/slate-safi-crew.jpg', 'Second unit, night shoot', 2)
) AS v(image_url, caption, sort_order)
WHERE f.slug = 'kibera-hustle';

INSERT INTO public.press_items (kind, title, outlet, quote, year, sort_order)
VALUES
('laurel', 'Official Selection', 'Durban International Film Festival', NULL, 2024, 1),
('laurel', 'Audience Award', 'Nairobi Film Festival', NULL, 2024, 2),
('laurel', 'Official Selection', 'BFI London Film Festival', NULL, 2024, 3),
('laurel', 'Best East African Feature — Nominee', 'Toronto Black Film Festival', NULL, 2025, 4),
('laurel', 'Spotlight Selection', 'SXSW Global', NULL, 2025, 5),
('quote', 'A love story with an engine in it.', 'Screen Africa', 'A love story with an engine in it — Slate Safi shoot Nairobi with the confidence of a studio three times their size.', 2024, 1),
('quote', 'One of the most assured East African debuts in years.', 'Sight & Sound', 'One of the most assured East African debuts in years.', 2024, 2),
('quote', 'Kenyan cinema''s most exportable new voice.', 'The Continent', 'Kenyan cinema''s most exportable new voice.', 2025, 3);

INSERT INTO public.posts (slug, title, excerpt, body, cover_image_url, author, category, published_at)
VALUES
('kibera-hustle-wraps-principal-photography', 'Kibera Hustle wraps principal photography',
 'After 47 shooting days across Nairobi, our second feature moves into post-production ahead of a 2026 festival run.',
 E'After 47 shooting days across Nairobi, Kibera Hustle has wrapped principal photography.\n\nThe production employed 94 crew members, 81 of them Kenyan, and trained eleven first-time department assistants through our on-set apprenticeship programme.\n\n"We wanted to make something that looks like the city actually looks," says director Wanjiru Mbatia. "Not the postcard, not the crisis story. The engineering of daily life here is extraordinary, and nobody films it."\n\nThe film now enters an eight-month post-production window in Nairobi and London, with a picture lock targeted for early 2026 and a festival premiere to follow.',
 '/images/kibera-hustle-hero.jpg', 'Slate Safi', 'Production', now() - interval '9 days'),
('boda-love-selected-for-bfi-london', 'Boda Love selected for BFI London Film Festival',
 'Our debut feature joins the Love strand in London, following its Durban premiere and Nairobi audience award.',
 E'Boda Love has been selected for the Love strand at the BFI London Film Festival, its third international selection following Durban and Nairobi.\n\nThe screening will be followed by a Q&A with director Wanjiru Mbatia and producer Samuel Ochieng, hosted at BFI Southbank.\n\nUK distribution conversations are ongoing. For festival programmers and distributors, screener access is available on request through our partnerships desk.',
 '/images/boda-love-hero.jpg', 'Slate Safi', 'Festivals', now() - interval '38 days'),
('building-a-kenyan-crew-pipeline', 'Building a Kenyan crew pipeline that travels',
 'Why we train departments instead of hiring in — and what that means for partners financing work in East Africa.',
 E'Every Slate Safi production carries a training line in its budget. Not as charity — as infrastructure.\n\nEast Africa does not have a crew shortage. It has a credit shortage: skilled people without the international credits that unlock the next job. Our productions are structured so that assistants leave with a named credit, a reel, and a reference that a producer in London or Toronto will actually read.\n\nFor financiers this is not a soft cost. It is why our second feature shot 18% under a comparable inbound production and why our department heads returned for a second film.',
 '/images/slate-safi-crew.jpg', 'Samuel Ochieng', 'Studio', now() - interval '72 days');