-- ============================================
-- Migration: add geocoded coordinates to reunion_nominations
-- Run in the Supabase SQL Editor
-- ============================================

alter table public.reunion_nominations
  add column lat double precision,
  add column lng double precision;
