-- ============================================================
-- Fix: Auth Signup — "Database error saving new user"
-- ============================================================
-- المشكلة:
--   دالة handle_new_user() تفتقد SET search_path = '' مما يسبب
--   فشل Supabase Auth عند إنشاء مستخدم جديد (خطأ 500).
--
-- الحل:
--   1. إعادة إنشاء الدالة مع SET search_path = '' وأسماء مؤهلة
--      (public.profiles بدلاً من profiles).
--   2. التأكد من وجود سياسات INSERT للـ profiles و settings.
--
-- آمن للتشغيل المتكرر (Idempotent).
-- لا يؤثر على أي بيانات موجودة أو مستخدمين حاليين.
-- ============================================================

-- 1. إزالة الـ trigger القديم (لفك الارتباط بالدالة)
DROP TRIGGER IF EXISTS trg_new_user_profile ON auth.users;

-- 2. إزالة الدالة القديمة
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. إنشاء الدالة من جديد مع الإصلاحات الأمنية
--    - SET search_path = '' يمنع search-path injection (توصية Supabase)
--    - public.profiles مؤهل بالكامل لأن search_path فارغ
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- 4. إعادة ربط الـ trigger
CREATE TRIGGER trg_new_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. سياسة INSERT للـ profiles (المستخدم ينشئ سجله الخاص فقط)
--    PK constraint يمنع التكرار تلقائياً
DROP POLICY IF EXISTS "User can insert own profile" ON profiles;
CREATE POLICY "User can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. سياسة INSERT للـ settings (المستخدم ينشئ إعداداته الخاصة فقط)
DROP POLICY IF EXISTS "User can insert own settings" ON settings;
CREATE POLICY "User can insert own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Fix: Auth signup failing with "Database error saving new user"
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Drop existing trigger and function (if any)
DROP TRIGGER IF EXISTS trg_new_user_profile ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recreate profile auto-creation function with error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- 3. Recreate the trigger
CREATE TRIGGER trg_new_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 4. Add INSERT policy for profiles (was missing)
DROP POLICY IF EXISTS "User can insert own profile" ON profiles;
CREATE POLICY "User can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Add INSERT policy for settings (needed for new user setup)
DROP POLICY IF EXISTS "User can insert own settings" ON settings;
CREATE POLICY "User can insert own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
