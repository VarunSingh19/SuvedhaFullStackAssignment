/*
  # Create Offer Letters Schema

  1. New Tables
    - `offer_letters`
      - `id` (uuid, primary key)
      - `ref_no` (text, unique)
      - `candidate_name` (text)
      - `email` (text)
      - `joining_date` (date)
      - `end_date` (date)
      - `domain` (text)
      - `pdf_url` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, foreign key)

  2. Security
    - Enable RLS on `offer_letters` table
    - Add policies for authenticated users to:
      - Read their own offer letters
      - Create new offer letters
      - Update their own offer letters
      - Delete their own offer letters
*/

CREATE TABLE IF NOT EXISTS offer_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_no text UNIQUE NOT NULL,
  candidate_name text NOT NULL,
  email text NOT NULL,
  joining_date date NOT NULL,
  end_date date NOT NULL,
  domain text NOT NULL,
  pdf_url text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own offer letters
CREATE POLICY "Users can read own offer letters"
  ON offer_letters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own offer letters
CREATE POLICY "Users can create offer letters"
  ON offer_letters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own offer letters
CREATE POLICY "Users can update own offer letters"
  ON offer_letters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own offer letters
CREATE POLICY "Users can delete own offer letters"
  ON offer_letters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_offer_letters_updated_at
  BEFORE UPDATE ON offer_letters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();