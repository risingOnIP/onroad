-- Create table for storing AI chat messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    tool_calls JSONB,
    files JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_messages_deal_id ON ai_chat_messages(deal_id);
CREATE INDEX idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- Enable RLS
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own chat messages" ON ai_chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" ON ai_chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No update or delete policies - chat messages should be immutable

-- Create updated_at trigger
CREATE TRIGGER update_ai_chat_messages_updated_at BEFORE UPDATE ON ai_chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();