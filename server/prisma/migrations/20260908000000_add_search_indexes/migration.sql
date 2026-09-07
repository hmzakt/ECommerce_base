-- Enable pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram indexes for fast similarity & ILIKE searches
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_brand_trgm_idx ON products USING gin(brand gin_trgm_ops);

-- Create GIN Full-Text Search index for English stemming and vector searches
CREATE INDEX IF NOT EXISTS products_fts_idx ON products USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(description, ''))
);
