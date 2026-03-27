-- Fix notifications table so users can insert notifications for other users
CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);
