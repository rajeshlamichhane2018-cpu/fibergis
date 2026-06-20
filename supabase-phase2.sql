-- Phase 2: Add status column to fiber_routes table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/whlcjcgqreykiheubmgw/sql

ALTER TABLE fiber_routes
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- status values: 'active' | 'planned' | 'damaged'
