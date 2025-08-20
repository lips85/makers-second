-- Teacher policies (can view students and rounds in their org)
CREATE POLICY "users_teacher_read" ON users 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users teacher 
      WHERE teacher.id = users.org_id 
      AND teacher.role = 'teacher' 
      AND teacher.auth_id = auth.uid()::text
    )
  );

CREATE POLICY "rounds_teacher_read" ON rounds 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN users teacher ON u.org_id = teacher.id 
      WHERE u.id = user_id 
      AND teacher.role = 'teacher' 
      AND teacher.auth_id = auth.uid()::text
    )
  );
