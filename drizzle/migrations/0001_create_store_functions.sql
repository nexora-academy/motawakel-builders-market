-- دوال آمنة (security definer) لعمليات الطلبات والإدارة

create or replace function public.create_order(
  _items jsonb, _name text, _phone text, _address text default null,
  _notes text default null, _user_id uuid default null
)
returns table (order_id uuid, order_number text, access_code text, total numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid; v_code text; v_num text; v_total numeric := 0;
  v_item jsonb; v_prod record; v_qty numeric;
begin
  if _items is null or jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 100 then
    raise exception 'INVALID_ITEMS';
  end if;
  v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 24));
  select 'MTW-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0') into v_num;
  insert into public.orders (order_number, access_code, user_id, customer_name, customer_phone, customer_address, notes, status)
  values (v_num, v_code, _user_id, _name, _phone, _address, _notes, 'new')
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
end $$;

create or replace function public.get_order_customer(_order_id uuid, _access_code text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select case when o.id is null then null else
    jsonb_build_object(
      'id', o.id, 'order_number', o.order_number, 'status', o.status,
      'customer_name', o.customer_name, 'customer_phone', o.customer_phone,
      'customer_address', o.customer_address, 'notes', o.notes, 'total', o.total,
      'created_at', o.created_at, 'payment_id', o.payment_id, 'user_id', o.user_id,
      'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_name_ar', i.product_name_ar, 'specs_ar', i.specs_ar,
        'unit_ar', i.unit_ar, 'quantity', i.quantity, 'unit_price', i.unit_price)), '[]'::jsonb)
        from public.order_items i where i.order_id = o.id)
    ) end
  from public.orders o
  where o.id = _order_id and o.access_code = _access_code;
$$;

create or replace function public.set_payment_id(_order_id uuid, _access_code text, _payment_id text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.orders
  set payment_id = _payment_id, status = case when status = 'new' then 'awaiting_payment' else status end
  where id = _order_id and access_code = _access_code and status not in ('paid', 'delivered');
  if not found then raise exception 'ORDER_NOT_PAYABLE'; end if;
end $$;

create or replace function public.set_order_paid(_order_id uuid, _access_code text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set status = 'paid'
  where id = _order_id and access_code = _access_code and payment_id is not null and status <> 'paid';
  if not found then raise exception 'ORDER_NOT_PAYABLE'; end if;
end $$;

create or replace function public.link_order_to_user(_order_id uuid, _access_code text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.orders set user_id = auth.uid()
  where id = _order_id and access_code = _access_code and user_id is null and auth.uid() is not null;
end $$;

create or replace function public.admin_set_order_status(_order_id uuid, _status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'FORBIDDEN'; end if;
  if _status not in ('new', 'processing', 'awaiting_payment', 'paid', 'delivered') then raise exception 'INVALID_STATUS'; end if;
  update public.orders set status = _status where id = _order_id;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
end $$;

create or replace function public.admin_update_order_item(_item_id uuid, _quantity numeric, _unit_price numeric)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid; v_total numeric := 0; v_row record;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'FORBIDDEN'; end if;
  if _quantity <= 0 or _unit_price < 0 then raise exception 'INVALID_VALUES'; end if;
  update public.order_items set quantity = _quantity, unit_price = _unit_price where id = _item_id
  returning order_id into v_order_id;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  for v_row in select quantity, unit_price from public.order_items where order_id = v_order_id loop
    v_total := v_total + (v_row.quantity * v_row.unit_price);
  end loop;
  update public.orders set total = v_total where id = v_order_id;
end $$;

create or replace function public.admin_set_setting(_key text, _value text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'FORBIDDEN'; end if;
  insert into public.app_settings (key, value, updated_at) values (_key, _value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

grant execute on function public.create_order(jsonb, text, text, text, text, uuid) to anon, authenticated;
grant execute on function public.get_order_customer(uuid, text) to anon, authenticated;
grant execute on function public.set_payment_id(uuid, text, text) to anon, authenticated;
grant execute on function public.set_order_paid(uuid, text) to anon, authenticated;
grant execute on function public.link_order_to_user(uuid, text) to authenticated;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;
grant execute on function public.admin_update_order_item(uuid, numeric, numeric) to authenticated;
grant execute on function public.admin_set_setting(text, text) to authenticated;