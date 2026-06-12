
CREATE TABLE public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  price_pkr numeric NOT NULL DEFAULT 0,
  old_price_pkr numeric,
  stock integer NOT NULL DEFAULT 0,
  image text,
  description text,
  prescription_required boolean NOT NULL DEFAULT false,
  rating numeric NOT NULL DEFAULT 4.5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.medicines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicines TO authenticated;
GRANT ALL ON public.medicines TO service_role;

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active medicines" ON public.medicines
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert medicines" ON public.medicines
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update medicines" ON public.medicines
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete medicines" ON public.medicines
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_medicines_updated_at BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
