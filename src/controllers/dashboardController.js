const firebaseService = require('../services/firebaseService');

const getDashboardStats = async (req, res) => {
    try {
        const stats = await firebaseService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

module.exports = {
    getDashboardStats
};
