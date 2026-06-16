
CREATE TABLE public.external_medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'timemedico',
  source_url TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  price_pkr NUMERIC(10,2),
  availability TEXT NOT NULL DEFAULT 'unknown',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_external_medicines_name ON public.external_medicines (name);
CREATE INDEX idx_external_medicines_last_seen ON public.external_medicines (last_seen_at DESC);

GRANT SELECT ON public.external_medicines TO anon, authenticated;
GRANT ALL ON public.external_medicines TO service_role;

ALTER TABLE public.external_medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view live medicines"
ON public.external_medicines FOR SELECT
USING (true);

CREATE TRIGGER trg_external_medicines_updated_at
BEFORE UPDATE ON public.external_medicines
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  items_synced INTEGER DEFAULT 0,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
ON public.sync_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
