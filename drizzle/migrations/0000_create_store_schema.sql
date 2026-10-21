-- أنواع وصف الأدوار
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- التصنيفات
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  description_ar text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- المنتجات
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name_ar text not null,
  specs_ar text,
  unit_ar text not null default 'قطعة',
  price numeric(12,2) not null default 0,
  in_stock boolean not null default true,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- تسلسل أرقام الطلبات
create sequence public.order_number_seq start 1;

-- الطلبات
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  access_code text not null,
  user_id uuid,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  status text not null default 'new',
  notes text,
  total numeric(12,2) not null default 0,
  payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name_ar text not null,
  specs_ar text,
  unit_ar text not null default 'قطعة',
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0
);

-- الإعدادات (رقم واتساب المبيعات وغيره)
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ===== GRANTs =====
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;

grant select on public.products to anon, authenticated;
grant all on public.products to service_role;

grant select on public.orders to authenticated;
grant all on public.orders to service_role;

grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;

grant select on public.app_settings to anon, authenticated;
grant all on public.app_settings to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;

-- ===== RLS =====
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.app_settings enable row level security;

create policy "Public read categories" on public.categories for select to anon, authenticated using (true);
create policy "Public read active products" on public.products for select to anon, authenticated using (is_active = true or public.has_role(auth.uid(), 'admin'));
create policy "Admin full products" on public.products for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Users read own orders" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admin update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Users read own order items" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
);

create policy "Public read settings" on public.app_settings for select to anon, authenticated using (true);

-- ===== تحديث updated_at تلقائيًا =====
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();
