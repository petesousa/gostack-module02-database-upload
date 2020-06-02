import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface BalanceDTO {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<BalanceDTO> {
    const transactions = await this.find();
    const { income, outcome } = transactions.reduce((totals, transaction) => {

      const { type, value } = transaction;

      if (type === 'income') totals.income += value;
      if (type === 'outcome') totals.outcome += value;

      return totals;
    }, {
      income: 0,
      outcome: 0
    });

    const total = income - outcome;
    return { income, outcome, total };
  }
}

export default TransactionsRepository;
