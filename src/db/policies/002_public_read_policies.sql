-- Public read policies for leaderboards, orgs, word_items
CREATE POLICY "leaderboards_read_all" ON leaderboards FOR SELECT USING (true);
CREATE POLICY "orgs_read_all" ON orgs FOR SELECT USING (true);
CREATE POLICY "word_items_read_all" ON word_items FOR SELECT USING (true);
