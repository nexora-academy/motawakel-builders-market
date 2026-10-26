CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label_ar text NOT NULL CHECK (length(trim(label_ar)) between 1 and 60),
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  in_stock boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_idx ON public.product_variants(product_id, sort_order);

GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read variants of active products" ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.is_active = true)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin full variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.order_items ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.create_order(_items jsonb, _name text, _phone text, _address text DEFAULT NULL::text, _notes text DEFAULT NULL::text, _user_id uuid DEFAULT NULL::uuid, _company text DEFAULT NULL::text, _vat text DEFAULT NULL::text, _national_address text DEFAULT NULL::text)
 RETURNS TABLE(order_id uuid, order_number text, access_code text, total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_id uuid; v_code text; v_num text; v_sub numeric := 0; v_total numeric := 0;
  v_rate numeric := 0.15;
  v_item jsonb; v_prod record; v_var record; v_qty numeric;
  v_price numeric; v_specs text; v_variant_id uuid;
begin
  if _items is null or jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 100 then
    raise exception 'INVALID_ITEMS';
  end if;
  if _name is null or length(trim(_name)) < 2 or length(_name) > 80 then raise exception 'INVALID_NAME'; end if;
  if _phone is null or _phone !~ '^\+?\d{9,15}$' then raise exception 'INVALID_PHONE'; end if;
  if _company is not null and length(_company) > 120 then raise exception 'INVALID_COMPANY'; end if;
  if _vat is not null and _vat <> '' and _vat !~ '^\d{15}$' then raise exception 'INVALID_VAT'; end if;
  if _national_address is not null and length(_national_address) > 250 then raise exception 'INVALID_ADDRESS'; end if;
  v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 24));
  select 'MTW-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0') into v_num;
  insert into public.orders (order_number, access_code, user_id, customer_name, customer_phone, customer_address, notes, status, company_name, vat_number, national_address, vat_rate)
  values (v_num, v_code, _user_id, _name, _phone, _address, _notes, 'new', nullif(trim(_company), ''), nullif(trim(_vat), ''), nullif(trim(_national_address), ''), v_rate)
  returning id into v_order_id;
  for v_item in select e from jsonb_array_elements(_items) e loop
    select id, name_ar, specs_ar, unit_ar, price into v_prod
    from public.products
    where id = (v_item->>'productId')::uuid and is_active = true;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    v_qty := least(greatest((v_item->>'qty')::numeric, 0.01), 1000000);
    v_variant_id := null;
    v_price := v_prod.price;
    v_specs := v_prod.specs_ar;
    if nullif(v_item->>'variantId', '') is not null then
      select id, label_ar, price into v_var
      from public.product_variants
      where id = (v_item->>'variantId')::uuid and product_id = v_prod.id;
      if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
      v_variant_id := v_var.id;
      v_price := v_var.price;
      v_specs := concat_ws(' — ', 'مقاس ' || v_var.label_ar, v_prod.specs_ar);
    elsif exists (select 1 from public.product_variants where product_id = v_prod.id) then
      raise exception 'VARIANT_REQUIRED';
    end if;
    insert into public.order_items (order_id, product_id, variant_id, product_name_ar, specs_ar, unit_ar, quantity, unit_price)
    values (v_order_id, v_prod.id, v_variant_id, v_prod.name_ar, v_specs, v_prod.unit_ar, v_qty, v_price);
    v_sub := v_sub + (v_qty * v_price);
  end loop;
  v_total := v_sub + round(v_sub * v_rate, 2);
  update public.orders set total = v_total where id = v_order_id;
  return query select v_order_id, v_num, v_code, v_total;
end $function$;