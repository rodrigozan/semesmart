import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import { isAuthenticated, hasProfileAccess, canWrite } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// All transaction routes are scoped under /api/profiles/:profileId/transactions.
// mergeParams: true ensures :profileId from the parent router is available here.

const readGuard = [isAuthenticated, hasProfileAccess];
const writeGuard = [isAuthenticated, hasProfileAccess, canWrite];

// ─── GET /api/profiles/:profileId/transactions ───────────────────────────────
// List transactions with optional filters and pagination.

router.get('/', readGuard, async (req, res) => {
  try {
    const { profileId } = req.params;
    const {
      month,
      year,
      type,
      category,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { profile: profileId };

    if (month !== undefined) filter.month = Number(month);
    if (year !== undefined) filter.year = Number(year);
    if (type) filter.type = type;
    if (category) filter.category = category;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [rawTransactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    const transactions = rawTransactions.map((tx) => ({ ...tx, id: tx._id.toString() }));

    return res.json({
      data: transactions,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── POST /api/profiles/:profileId/transactions ──────────────────────────────
// Create a new transaction.

router.post('/', writeGuard, async (req, res) => {
  try {
    const { profileId } = req.params;
    const {
      type,
      amount,
      description,
      category,
      paymentMethod,
      date,
      location,
      incomeSource,
      tags,
      source,
    } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: 'Os campos type e description são obrigatórios.' });
    }

    const VALID_TRANSACTION_TYPES = ['income', 'expense'];
    if (!VALID_TRANSACTION_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Tipo de transação inválido. Valores permitidos: ${VALID_TRANSACTION_TYPES.join(', ')}`,
      });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'O campo amount é obrigatório.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'O campo amount deve ser positivo.' });
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return res.status(400).json({ error: 'O campo tags deve ser um array.' });
    }

    const parsedDate = date ? new Date(date) : new Date();
    const month = parsedDate.getMonth() + 1; // 1–12
    const year = parsedDate.getFullYear();

    const transaction = await Transaction.create({
      profile: profileId,
      createdBy: req.user._id,
      type,
      amount,
      description,
      category,
      paymentMethod,
      date: parsedDate,
      month,
      year,
      location,
      incomeSource,
      tags,
      source: source || 'manual',
    });

    return res.status(201).json({ data: transaction });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── PUT /api/profiles/:profileId/transactions/:id ───────────────────────────
// Update a transaction. Scoped to profile for security.

router.put('/:id', writeGuard, async (req, res) => {
  try {
    const { profileId, id } = req.params;
    const {
      type,
      amount,
      description,
      category,
      paymentMethod,
      date,
      location,
      incomeSource,
      tags,
    } = req.body;

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ error: 'O campo amount deve ser positivo.' });
    }

    if (type !== undefined) {
      const VALID_TRANSACTION_TYPES = ['income', 'expense'];
      if (!VALID_TRANSACTION_TYPES.includes(type)) {
        return res.status(400).json({
          error: `Tipo de transação inválido. Valores permitidos: ${VALID_TRANSACTION_TYPES.join(', ')}`,
        });
      }
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return res.status(400).json({ error: 'O campo tags deve ser um array.' });
    }

    const updates = {};
    if (type !== undefined) updates.type = type;
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (location !== undefined) updates.location = location;
    if (incomeSource !== undefined) updates.incomeSource = incomeSource;
    if (tags !== undefined) updates.tags = tags;

    if (date !== undefined) {
      const parsedDate = new Date(date);
      updates.date = parsedDate;
      updates.month = parsedDate.getMonth() + 1;
      updates.year = parsedDate.getFullYear();
    }

    // Always scope the lookup to the profile — prevents cross-profile mutation.
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, profile: profileId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    return res.json({ data: transaction });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── DELETE /api/profiles/:profileId/transactions/:id ────────────────────────
// Delete a transaction. Scoped to profile for security.

router.delete('/:id', writeGuard, async (req, res) => {
  try {
    const { profileId, id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      profile: profileId,
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    return res.json({ data: { message: 'Transação removida com sucesso.' } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
