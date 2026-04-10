import { Activity } from '../models/Activity.model.js';

/**
 * GET /api/activity
 * Returns the latest 100 activities, sorted by newest first
 */
export const getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ activities });
  } catch (err) {
    console.error('Failed to fetch activities:', err);
    return res.status(500).json({ error: err.message });
  }
};
