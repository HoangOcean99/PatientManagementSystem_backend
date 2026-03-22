import * as dashboardService from '../services/dashboardService.js';

export const getAdminStats = async (req, res, next) => {
    try {
        const stats = await dashboardService.getAdminStats();
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
