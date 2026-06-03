const userService = require('../services/userService');

async function getProfile(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await userService.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const avatarPath = user.avatar_url || null;
    const avatarUrl = avatarPath ? `${req.protocol}://${req.get('host')}${avatarPath}` : null;

    res.json({ profile: { id: user.user_id, email: user.email, name: user.full_name, avatarUrl } });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateAvatar(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const relativePath = `/uploads/avatars/${req.file.filename}`;
    await userService.updateAvatar(userId, relativePath);

    const fullUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    res.json({ avatarUrl: fullUrl });
  } catch (err) {
    console.error('updateAvatar error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { getProfile, updateAvatar };
