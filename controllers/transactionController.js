const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const AuditLog = require('../models/AuditLog');

const topUpWallet = async (req, res) => {
  const { wallet_id, amount, payment_method } = req.body;

  try {
    const wallet = await Wallet.findById(wallet_id);
    if (!wallet || wallet.user_id !== req.user.user_id) {
      return res.status(400).json({ message: 'Wallet not found or access denied' });
    }

    const transaction_id = await Transaction.create({
      wallet_id,
      amount,
      transaction_type: 'top_up',
      payment_method,
      description: `Wallet top-up of ${amount}`
    });

    await Wallet.updateBalance(wallet_id, wallet.balance + amount);
    await Transaction.updateStatus(transaction_id, 'completed');

    await AuditLog.create({
      user_id: req.user.user_id,
      action: 'Wallet topped up',
      entity_type: 'transaction',
      entity_id: transaction_id,
      details: { wallet_id, amount, payment_method }
    });

    res.json({ message: 'Wallet topped up successfully' });
  } catch (error) {
    throw error;
  }
};

module.exports = { topUpWallet };