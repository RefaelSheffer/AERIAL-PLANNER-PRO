ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_endpoint_key UNIQUE (endpoint);
