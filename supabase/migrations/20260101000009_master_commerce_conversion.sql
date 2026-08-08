-- Master commerce: module à la carte + conversion packaging
ALTER TABLE add_ons
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'capacity',
  ADD COLUMN IF NOT EXISTS unlocks_feature TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS badge TEXT;

COMMENT ON COLUMN add_ons.category IS 'capacity | module | support | growth';
COMMENT ON COLUMN add_ons.unlocks_feature IS 'plan_features.feature_key unlocked when purchased';

-- Allow public conversion leads without org yet
ALTER TABLE leads ALTER COLUMN organization_id DROP NOT NULL;

-- Conversion chatbot conversations (public visitors)
CREATE TABLE IF NOT EXISTS conversion_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  locale TEXT DEFAULT 'en',
  stage TEXT DEFAULT 'greeting',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversion_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES conversion_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'user', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_chat_sessions_visitor ON conversion_chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_conversion_chat_messages_session ON conversion_chat_messages(session_id, created_at);

ALTER TABLE conversion_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversion_chat_deny_all ON conversion_chat_sessions;
CREATE POLICY conversion_chat_deny_all ON conversion_chat_sessions FOR ALL TO authenticated USING (false);
DROP POLICY IF EXISTS conversion_chat_msg_deny_all ON conversion_chat_messages;
CREATE POLICY conversion_chat_msg_deny_all ON conversion_chat_messages FOR ALL TO authenticated USING (false);
