/*
  # Initial Schema Setup for Andy & Ale's Blog

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `username` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
    
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `created_at` (timestamp)
      - `author_id` (uuid, references profiles)
    
    - `photos`
      - `id` (uuid, primary key)
      - `url` (text)
      - `post_id` (uuid, references posts)
      - `created_at` (timestamp)
    
    - `love_notes`
      - `id` (uuid, primary key)
      - `content` (text)
      - `author_id` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated write access
*/

-- Create tables
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now(),
  author_id uuid REFERENCES profiles(id) NOT NULL
);

CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  post_id uuid REFERENCES posts(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE love_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Post authors can update their posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Photos are viewable by everyone" ON photos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload photos" ON photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Love notes are viewable by everyone" ON love_notes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create love notes" ON love_notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');