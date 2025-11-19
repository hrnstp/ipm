-- Migration to optimize bid counting and add helper functions
-- Created: 2025-11-19

-- Function to get bid counts for multiple RFPs in one query
CREATE OR REPLACE FUNCTION get_rfp_bid_counts(rfp_ids uuid[])
RETURNS TABLE (rfp_id uuid, bid_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    bids.rfp_id,
    COUNT(bids.id) as bid_count
  FROM bids
  WHERE bids.rfp_id = ANY(rfp_ids)
  GROUP BY bids.rfp_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_rfp_bid_counts(uuid[]) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_rfp_bid_counts IS 'Returns bid counts for multiple RFPs in a single query to avoid N+1 problem';
