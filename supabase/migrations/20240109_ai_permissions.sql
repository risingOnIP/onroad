-- Create AI sessions table for context management
CREATE TABLE IF NOT EXISTS ai_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('realtor', 'client', 'broker')),
  user_email TEXT,
  current_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  current_form_id UUID REFERENCES forms(id) ON DELETE SET NULL,
  current_client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  current_page TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI tool executions table for audit logging
CREATE TABLE IF NOT EXISTS ai_tool_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('realtor', 'client', 'broker')),
  session_id TEXT,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  result TEXT,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_session_id ON ai_sessions(session_id);
CREATE INDEX idx_ai_sessions_updated_at ON ai_sessions(updated_at);

CREATE INDEX idx_ai_tool_executions_user_id ON ai_tool_executions(user_id);
CREATE INDEX idx_ai_tool_executions_tool_name ON ai_tool_executions(tool_name);
CREATE INDEX idx_ai_tool_executions_timestamp ON ai_tool_executions(timestamp);
CREATE INDEX idx_ai_tool_executions_deal_id ON ai_tool_executions(deal_id);

-- Enable Row Level Security
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_sessions
-- Users can only see their own sessions
CREATE POLICY "Users can view own AI sessions"
  ON ai_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own AI sessions"
  ON ai_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own AI sessions"
  ON ai_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own AI sessions"
  ON ai_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_tool_executions
-- Users can only see their own tool executions
CREATE POLICY "Users can view own AI tool executions"
  ON ai_tool_executions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Brokers can see all tool executions for their realtors
CREATE POLICY "Brokers can view realtor AI tool executions"
  ON ai_tool_executions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      WHERE u1.id = auth.uid()
      AND u1.user_role = 'broker'
      AND EXISTS (
        SELECT 1 FROM tethers t
        WHERE t.broker_id = u1.id
        AND t.realtor_id = ai_tool_executions.user_id
      )
    )
  );

-- Service role can insert tool executions (for backend logging)
CREATE POLICY "Service role can insert AI tool executions"
  ON ai_tool_executions
  FOR INSERT
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ai_sessions
CREATE TRIGGER update_ai_sessions_timestamp
  BEFORE UPDATE ON ai_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_session_timestamp();

-- Create function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_ai_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_sessions
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE ai_sessions IS 'Stores AI context sessions for maintaining state across requests';
COMMENT ON TABLE ai_tool_executions IS 'Audit log of all AI tool executions for security and compliance';
COMMENT ON COLUMN ai_sessions.metadata IS 'Additional context data specific to the session';
COMMENT ON COLUMN ai_tool_executions.duration_ms IS 'Execution time in milliseconds for performance monitoring';