import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import Profile from '../models/Profile.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/dashboard/consolidated ─────────────────────────────────────────
// Aggregates transactions across all profiles owned by the owner user.
router.get('/consolidated', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Apenas o proprietário pode acessar o dashboard consolidado.' });
    }

    let { month, year } = req.query;
    if (month !== undefined) month = Number(month);
    if (year !== undefined) year = Number(year);

    const profileIds = await Profile.find({ owner: req.user._id }).distinct('_id');

    if (profileIds.length === 0) {
      return res.json({
        data: {
          totalIncomes: 0,
          totalExpenses: 0,
          balance: 0,
          byProfile: [],
          byCategory: [],
        },
      });
    }

    const match = { profile: { $in: profileIds } };
    if (month !== undefined && !isNaN(month)) match.month = month;
    if (year !== undefined && !isNaN(year)) match.year = year;

    const [aggregationResult] = await Transaction.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalIncomes: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
                totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
              },
            },
          ],
          byProfile: [
            {
              $group: {
                _id: '$profile',
                incomes: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
                expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
              },
            },
            {
              $lookup: {
                from: 'profiles',
                localField: '_id',
                foreignField: '_id',
                as: 'profileInfo',
              },
            },
            { $unwind: '$profileInfo' },
            {
              $project: {
                _id: 0,
                profileId: '$_id',
                profileName: '$profileInfo.name',
                profileColor: '$profileInfo.color',
                incomes: 1,
                expenses: 1,
                balance: { $subtract: ['$incomes', '$expenses'] },
              },
            },
          ],
          byCategory: [
            { $match: { type: 'expense', category: { $exists: true, $ne: null } } },
            {
              $group: {
                _id: { category: '$category', profile: '$profile' },
                value: { $sum: '$amount' },
              },
            },
            { $sort: { value: -1 } },
            {
              $project: {
                _id: 0,
                name: '$_id.category',
                value: 1,
                profileId: '$_id.profile',
              },
            },
          ],
        },
      },
    ]);

    const totals = aggregationResult?.totals?.[0] ?? { totalIncomes: 0, totalExpenses: 0 };

    return res.json({
      data: {
        totalIncomes: totals.totalIncomes,
        totalExpenses: totals.totalExpenses,
        balance: totals.totalIncomes - totals.totalExpenses,
        byProfile: aggregationResult?.byProfile ?? [],
        byCategory: aggregationResult?.byCategory ?? [],
      },
    });
  } catch (err) {
    console.error('Erro no dashboard consolidado:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
