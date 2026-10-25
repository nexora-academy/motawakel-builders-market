ALTER TABLE public.orders ADD COLUMN vat_rate numeric NOT NULL DEFAULT 0.15;

-- إعادة حساب إجمالي الطلبات الحالية بحيث يشمل ضريبة القيمة المضافة 15%
UPDATE public.orders o
SET total = s.sub + round(s.sub * o.vat_rate, 2)
FROM (
  SELECT order_id, coalesce(sum(quantity * unit_price), 0) AS sub
  FROM public.order_items GROUP BY order_id
) s
WHERE s.order_id = o.id;

CREATE OR REPLACE FUNCTION public.create_order(_items jsonb, _name text, _phone text, _address text DEFAULT NULL::text, _notes text DEFAULT NULL::text, _user_id uuid DEFAULT NULL::uuid, _company text DEFAULT NULL::text, _vat text DEFAULT NULL::text, _national_address text DEFAULT NULL::text)
 RETURNS TABLE(order_id uuid, order_number text, access_code text, total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_id uuid; v_code text; v_num text; v_sub numeric := 0; v_total numeric := 0;
  v_rate numeric := 0.15;
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
  insert into public.orders (order_number, access_code, user_id, customer_name, customer_phone, customer_address, notes, status, company_name, vat_number, national_address, vat_rate)
  values (v_num, v_code, _user_id, _name, _phone, _address, _notes, 'new', nullif(trim(_company), ''), nullif(trim(_vat), ''), nullif(trim(_national_address), ''), v_rate)
  returning id into v_order_id;
  for v_item in select e from jsonb_array_elements(_items) e loop
    select id, name_ar, specs_ar, unit_ar, price into v_prod
    from public.products
    where id = (v_item->>'productId')::uuid and is_active = true;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    v_qty := least(greatest((v_item->>'qty')::numeric, 0.01), 1000000);
    insert into public.order_items (order_id, product_id, product_name_ar, specs_ar, unit_ar, quantity, unit_price)
    values (v_order_id, v_prod.id, v_prod.name_ar, v_prod.specs_ar, v_prod.unit_ar, v_qty, v_prod.price);
    v_sub := v_sub + (v_qty * v_prod.price);
  end loop;
  v_total := v_sub + round(v_sub * v_rate, 2);
  update public.orders set total = v_total where id = v_order_id;
  return query select v_order_id, v_num, v_code, v_total;
end $function$;

CREATE OR REPLACE FUNCTION public.admin_update_order_item(_item_id uuid, _quantity numeric, _unit_price numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_id uuid; v_sub numeric := 0;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'FORBIDDEN'; end if;
  if _quantity <= 0 or _unit_price < 0 then raise exception 'INVALID_VALUES'; end if;
  update public.order_items set quantity = _quantity, unit_price = _unit_price where id = _item_id
  returning order_id into v_order_id;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  select coalesce(sum(quantity * unit_price), 0) into v_sub from public.order_items where order_id = v_order_id;
  update public.orders set total = v_sub + round(v_sub * vat_rate, 2) where id = v_order_id;
end $function$;

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
      'vat_rate', o.vat_rate,
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

CREATE OR REPLACE FUNCTION public.admin_delete_order(_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'FORBIDDEN'; end if;
  delete from public.order_items where order_id = _order_id;
  delete from public.orders where id = _order_id;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
end $function$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_order(uuid) TO authenticated, service_role;