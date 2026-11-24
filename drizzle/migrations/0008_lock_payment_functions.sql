REVOKE EXECUTE ON FUNCTION public.set_order_paid(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_payment_id(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_paid(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_payment_id(uuid, text, text) TO service_role;