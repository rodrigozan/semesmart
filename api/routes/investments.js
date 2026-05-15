import { Router } from 'express';
import Investment from '../models/Investment.js';
import { isAuthenticated, hasProfileAccess, canWrite } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// All investment routes are scoped under /api/profiles/:profileId/investments.
// mergeParams: true ensures :profileId from the parent router is available here.

const readGuard = [isAuthenticated, hasProfileAccess];
const writeGuard = [isAuthenticated, hasProfileAccess, canWrite];

// ─── GET /api/profiles/:profileId/investments/summary ────────────────────────
// Wallet summary aggregated by investment type.
// IMPORTANT: mounted BEFORE /:id to prevent Express routing conflict.

router.get('/summary', readGuard, async (req, res) => {
  try {
    const { profileId } = req.params;

    const rawInvestments = await Investment.find({ profile: profileId }).lean();
    const investments = rawInvestments.map((inv) => ({ ...inv, id: inv._id.toString() }));

    const byType = {};
    let totalInvested = 0;
    let totalCurrentValue = 0;

    for (const inv of investments) {
      const invested = inv.quantity * inv.averagePrice;
      const current = inv.quantity * (inv.currentPrice ?? inv.averagePrice);

      totalInvested += invested;
      totalCurrentValue += current;

      if (!byType[inv.type]) {
        byType[inv.type] = {
          totalInvested: 0,
          totalCurrentValue: 0,
          count: 0,
          items: [],
        };
      }

      byType[inv.type].totalInvested += invested;
      byType[inv.type].totalCurrentValue += current;
      byType[inv.type].count += 1;
      byType[inv.type].items.push({
        _id: inv._id,
        ticker: inv.ticker,
        name: inv.name,
        quantity: inv.quantity,
        averagePrice: inv.averagePrice,
        currentPrice: inv.currentPrice,
        invested,
        currentValue: current,
        profitLoss: current - invested,
        profitLossPercent: invested > 0 ? ((current - invested) / invested) * 100 : 0,
      });
    }

    // Compute per-type profit/loss percentages.
    for (const key of Object.keys(byType)) {
      const t = byType[key];
      t.profitLoss = t.totalCurrentValue - t.totalInvested;
      t.profitLossPercent =
        t.totalInvested > 0
          ? ((t.totalCurrentValue - t.totalInvested) / t.totalInvested) * 100
          : 0;
    }

    const profitLoss = totalCurrentValue - totalInvested;
    const profitLossPercent =
      totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;

    return res.json({
      data: {
        totalInvested,
        totalCurrentValue,
        profitLoss,
        profitLossPercent,
        byType,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── GET /api/profiles/:profileId/investments ────────────────────────────────
// List all investments for the profile.

router.get('/', readGuard, async (req, res) => {
  try {
    const { profileId } = req.params;

    const rawInvestments = await Investment.find({ profile: profileId })
      .sort({ createdAt: -1 })
      .lean();

    const investments = rawInvestments.map((inv) => ({ ...inv, id: inv._id.toString() }));

    return res.json({ data: investments, total: investments.length });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── POST /api/profiles/:profileId/investments ───────────────────────────────
// Add a new investment position.

router.post('/', writeGuard, async (req, res) => {
  try {
    const { profileId } = req.params;
    const {
      type,
      ticker,
      name,
      quantity,
      averagePrice,
      currentPrice,
      sector,
      broker,
      purchaseDate,
      notes,
    } = req.body;

    if (!type || !ticker || !name || quantity === undefined || averagePrice === undefined) {
      return res.status(400).json({
        error: 'Os campos type, ticker, name, quantity e averagePrice são obrigatórios.',
      });
    }

    const VALID_TYPES = ['stock', 'fii', 'fixed_income', 'crypto', 'other'];
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Tipo de investimento inválido. Valores permitidos: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (typeof ticker !== 'string' || ticker.trim().length === 0) {
      return res.status(400).json({ error: 'O campo ticker deve ser uma string não vazia.' });
    }

    if (quantity <= 0 || averagePrice <= 0) {
      return res.status(400).json({
        error: 'Os campos quantity e averagePrice devem ser positivos.',
      });
    }

    const investment = await Investment.create({
      profile: profileId,
      createdBy: req.user._id,
      type,
      ticker: ticker.trim().toUpperCase(),
      name,
      quantity,
      averagePrice,
      currentPrice,
      sector,
      broker,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      notes,
    });

    return res.status(201).json({ data: investment });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── PUT /api/profiles/:profileId/investments/:id ────────────────────────────
// Update an investment (price, quantity, notes). Scoped to profile.

router.put('/:id', writeGuard, async (req, res) => {
  try {
    const { profileId, id } = req.params;
    const { currentPrice, quantity, averagePrice, notes, sector, broker } = req.body;

    if (quantity !== undefined && quantity <= 0) {
      return res.status(400).json({ error: 'O campo quantity deve ser positivo.' });
    }

    if (averagePrice !== undefined && averagePrice <= 0) {
      return res.status(400).json({ error: 'O campo averagePrice deve ser positivo.' });
    }

    const updates = { updatedAt: new Date() };
    if (currentPrice !== undefined) updates.currentPrice = currentPrice;
    if (quantity !== undefined) updates.quantity = quantity;
    if (averagePrice !== undefined) updates.averagePrice = averagePrice;
    if (notes !== undefined) updates.notes = notes;
    if (sector !== undefined) updates.sector = sector;
    if (broker !== undefined) updates.broker = broker;

    const investment = await Investment.findOneAndUpdate(
      { _id: id, profile: profileId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!investment) {
      return res.status(404).json({ error: 'Investimento não encontrado.' });
    }

    return res.json({ data: investment });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── DELETE /api/profiles/:profileId/investments/:id ─────────────────────────
// Remove an investment. Scoped to profile.

router.delete('/:id', writeGuard, async (req, res) => {
  try {
    const { profileId, id } = req.params;

    const investment = await Investment.findOneAndDelete({
      _id: id,
      profile: profileId,
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investimento não encontrado.' });
    }

    return res.json({ data: { message: 'Investimento removido com sucesso.' } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
