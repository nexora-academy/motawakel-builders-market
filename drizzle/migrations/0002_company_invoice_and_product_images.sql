ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS national_address text;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

DROP FUNCTION IF EXISTS public.create_order(jsonb, text, text, text, text, uuid);

CREATE FUNCTION public.create_order(
  _items jsonb, _name text, _phone text,
  _address text DEFAULT NULL, _notes text DEFAULT NULL, _user_id uuid DEFAULT NULL,
  _company text DEFAULT NULL, _vat text DEFAULT NULL, _national_address text DEFAULT NULL)
 RETURNS TABLE(order_id uuid, order_number text, access_code text, total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_id uuid; v_code text; v_num text; v_total numeric := 0;
  v_item jsonb; v_prod record; v_qty numeric;
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
  insert into public.orders (order_number, access_code, user_id, customer_name, customer_phone, customer_address, notes, status, company_name, vat_number, national_address)
  values (v_num, v_code, _user_id, _name, _phone, _address, _notes, 'new', nullif(trim(_company), ''), nullif(trim(_vat), ''), nullif(trim(_national_address), ''))
  returning id into v_order_id;
  for v_item in select e from jsonb_array_elements(_items) e loop
    select id, name_ar, specs_ar, unit_ar, price into v_prod
    from public.products
    where id = (v_item->>'productId')::uuid and is_active = true;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    v_qty := least(greatest((v_item->>'qty')::numeric, 0.01), 1000000);
    insert into public.order_items (order_id, product_id, product_name_ar, specs_ar, unit_ar, quantity, unit_price)
    values (v_order_id, v_prod.id, v_prod.name_ar, v_prod.specs_ar, v_prod.unit_ar, v_qty, v_prod.price);
    v_total := v_total + (v_qty * v_prod.price);
  end loop;
  update public.orders set total = v_total where id = v_order_id;
  return query select v_order_id, v_num, v_code, v_total;
end $function$;

GRANT EXECUTE ON FUNCTION public.create_order(jsonb, text, text, text, text, uuid, text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_order_customer(_order_id uuid, _access_code text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case when o.id is null then null else
    jsonb_build_object(
      'id', o.id, 'order_number', o.order_number, 'status', o.status,
      'customer_name', o.customer_name, 'customer_phone', o.customer_phone,
      'customer_address', o.customer_address, 'notes', o.notes, 'total', o.total,
      'created_at', o.created_at, 'payment_id', o.payment_id, 'user_id', o.user_id,
      'company_name', o.company_name, 'vat_number', o.vat_number, 'national_address', o.national_address,
      'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_name_ar', i.product_name_ar, 'specs_ar', i.specs_ar,
        'unit_ar', i.unit_ar, 'quantity', i.quantity, 'unit_price', i.unit_price)), '[]'::jsonb)
        from public.order_items i where i.order_id = o.id)
    ) end
  from public.orders o
  where o.id = _order_id and o.access_code = _access_code;
$function$;

CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Admin upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));