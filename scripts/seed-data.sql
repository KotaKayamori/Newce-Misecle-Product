-- Insert sample restaurants
INSERT INTO restaurants (name, genre, distance, available_seats, rating, price_range, subscription_discount, available_now) VALUES
('カフェ・ド・パリ', 'フレンチ', 0.2, 3, 4.5, '¥2,000-3,000', true, true),
('寿司 銀座', '和食', 0.5, 2, 4.8, '¥5,000-8,000', false, true),
('イタリアン・ビストロ', 'イタリアン', 0.8, 5, 4.3, '¥3,000-4,000', true, true),
('焼肉 炭火亭', '焼肉', 0.3, 4, 4.6, '¥3,000-4,000', true, true),
('パスタ・ハウス', 'イタリアン', 0.7, 2, 4.2, '¥2,000-3,000', false, true),
('天ぷら 季節', '和食', 1.2, 1, 4.7, '¥4,000-6,000', true, true);

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, price, features) VALUES
('ベーシック', 980, '{"priority_booking": true, "cancellation_alerts": true, "monthly_discounts": 3}'),
('プレミアム', 1980, '{"priority_booking": true, "guaranteed_booking": true, "unlimited_discounts": true, "dedicated_support": true, "cancellation_alerts": true}');

-- Insert sample notifications (you'll need to replace user_id with actual UUIDs)
-- INSERT INTO notifications (user_id, type, title, message, read) VALUES
-- ('your-user-uuid', 'reservation', '予約確認のお知らせ', '寿司 銀座での予約が確定しました。1月20日 18:30〜', false),
-- ('your-user-uuid', 'promotion', '会員限定特典', '今週末限定！対象店舗で20%オフクーポンをプレゼント', false);
