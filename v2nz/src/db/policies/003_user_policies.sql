-- User-specific data policies (own data only)
CREATE POLICY "users_owner_rw" ON users 
  USING (auth.uid()::text = auth_id) 
  WITH CHECK (auth.uid()::text = auth_id);

CREATE POLICY "rounds_owner_rw" ON rounds 
  USING (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id)) 
  WITH CHECK (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "round_items_owner_rw" ON round_items 
  USING (EXISTS (
    SELECT 1 FROM rounds r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.id = round_id AND u.auth_id = auth.uid()::text
  )) 
  WITH CHECK (EXISTS (
    SELECT 1 FROM rounds r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.id = round_id AND u.auth_id = auth.uid()::text
  ));
