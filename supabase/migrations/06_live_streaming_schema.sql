-- Live Streaming Schema
-- This migration creates tables for live streaming functionality

-- Create live_streams table
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    viewer_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_live BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stream_viewers table
CREATE TABLE IF NOT EXISTS stream_viewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(stream_id, user_id)
);

-- Create stream_messages table
CREATE TABLE IF NOT EXISTS stream_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stream_gifts table
CREATE TABLE IF NOT EXISTS stream_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gift_id VARCHAR(50) NOT NULL,
    gift_name VARCHAR(100) NOT NULL,
    gift_cost INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stream_reports table
CREATE TABLE IF NOT EXISTS stream_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_category ON live_streams(category);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON live_streams(is_live);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_at ON live_streams(created_at);

CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_user_id ON stream_viewers(user_id);

CREATE INDEX IF NOT EXISTS idx_stream_messages_stream_id ON stream_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_messages_user_id ON stream_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_messages_created_at ON stream_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_stream_gifts_stream_id ON stream_gifts(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_user_id ON stream_gifts(user_id);

CREATE INDEX IF NOT EXISTS idx_stream_reports_stream_id ON stream_reports(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_reports_user_id ON stream_reports(user_id);

-- Create RLS policies
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_reports ENABLE ROW LEVEL SECURITY;

-- Live streams policies
CREATE POLICY "Users can view live streams" ON live_streams
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own streams" ON live_streams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streams" ON live_streams
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streams" ON live_streams
    FOR DELETE USING (auth.uid() = user_id);

-- Stream viewers policies
CREATE POLICY "Users can view stream viewers" ON stream_viewers
    FOR SELECT USING (true);

CREATE POLICY "Users can join streams" ON stream_viewers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave streams" ON stream_viewers
    FOR DELETE USING (auth.uid() = user_id);

-- Stream messages policies
CREATE POLICY "Users can view stream messages" ON stream_messages
    FOR SELECT USING (true);

CREATE POLICY "Users can send messages to streams" ON stream_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stream gifts policies
CREATE POLICY "Users can view stream gifts" ON stream_gifts
    FOR SELECT USING (true);

CREATE POLICY "Users can send gifts to streams" ON stream_gifts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stream reports policies
CREATE POLICY "Users can create stream reports" ON stream_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports" ON stream_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Create functions for live streaming
CREATE OR REPLACE FUNCTION update_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE live_streams 
        SET viewer_count = viewer_count + 1
        WHERE id = NEW.stream_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE live_streams 
        SET viewer_count = GREATEST(viewer_count - 1, 0)
        WHERE id = OLD.stream_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_viewer_count_on_join
    AFTER INSERT ON stream_viewers
    FOR EACH ROW EXECUTE FUNCTION update_stream_viewer_count();

CREATE TRIGGER update_viewer_count_on_leave
    AFTER DELETE ON stream_viewers
    FOR EACH ROW EXECUTE FUNCTION update_stream_viewer_count();

-- Create function to get stream statistics
CREATE OR REPLACE FUNCTION get_stream_stats(stream_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'viewer_count', s.viewer_count,
        'like_count', s.like_count,
        'share_count', s.share_count,
        'created_at', s.created_at,
        'unique_viewers', COUNT(DISTINCT sv.user_id),
        'message_count', COUNT(DISTINCT sm.id),
        'gift_count', COUNT(DISTINCT sg.id)
    ) INTO result
    FROM live_streams s
    LEFT JOIN stream_viewers sv ON s.id = sv.stream_id
    LEFT JOIN stream_messages sm ON s.id = sm.stream_id
    LEFT JOIN stream_gifts sg ON s.id = sg.stream_id
    WHERE s.id = stream_uuid
    GROUP BY s.id, s.viewer_count, s.like_count, s.share_count, s.created_at;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get active streams
CREATE OR REPLACE FUNCTION get_active_streams(
    category_filter VARCHAR DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', s.id,
            'title', s.title,
            'description', s.description,
            'category', s.category,
            'tags', s.tags,
            'viewer_count', s.viewer_count,
            'like_count', s.like_count,
            'share_count', s.share_count,
            'created_at', s.created_at,
            'is_live', s.is_live,
            'user', json_build_object(
                'id', u.id,
                'name', u.name,
                'username', u.username,
                'avatar_url', u.avatar_url,
                'is_verified', u.is_verified
            )
        )
    ) INTO result
    FROM live_streams s
    JOIN users u ON s.user_id = u.id
    WHERE s.is_live = true
    AND (category_filter IS NULL OR s.category = category_filter)
    ORDER BY s.created_at DESC
    LIMIT limit_count OFFSET offset_count;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;