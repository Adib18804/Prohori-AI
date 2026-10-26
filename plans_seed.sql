INSERT INTO plans (code, name, price, monthly_debates, billing_cycle, category, discount_percent, is_popular, savings_text, features, is_active) 
VALUES 
('free', 'Free', 0.00, 10, 'monthly', 'standard', 0, false, NULL, '["10 debates/month", "Basic protection"]', true),
('pro', 'Pro', 29.00, 1000, 'monthly', 'professional', 10, true, 'Save 10%', '["1000 debates/month", "Advanced protection", "Priority support"]', true),
('enterprise', 'Enterprise', 199.00, 10000, 'monthly', 'enterprise', 20, false, 'Save 20%', '["10000 debates/month", "Dedicated support", "Custom rules"]', true);
