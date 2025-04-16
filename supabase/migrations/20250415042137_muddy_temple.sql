/*
  # Fix schema and permissions for posts and love notes

  1. Changes
    - Add missing profiles table
    - Fix foreign key relationships
    - Update RLS policies for all tables
    - Enable storage for photo uploads

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for public access where needed
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO public 
USING (auth.uid() = id);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
ON public.posts FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON public.posts FOR INSERT
TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
TO public
USING (auth.uid() = author_id);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Photos policies
CREATE POLICY "Photos are viewable by everyone"
ON public.photos FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can upload photos"
ON public.photos FOR INSERT
TO public
WITH CHECK (auth.role() = 'authenticated');

-- Love notes table
CREATE TABLE IF NOT EXISTS public.love_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.love_notes ENABLE ROW LEVEL SECURITY;

-- Love notes policies
CREATE POLICY "Love notes are viewable by everyone"
ON public.love_notes FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create love notes"
ON public.love_notes FOR INSERT
TO public
WITH CHECK (auth.role() = 'authenticated');

-- Create a trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();