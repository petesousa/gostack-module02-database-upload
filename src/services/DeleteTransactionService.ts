import { getCustomRepository } from "typeorm";
import TransactionsRepository from "../repositories/TransactionsRepository";
import AppError from "../errors/AppError";


class DeleteTransactionService {
  public async execute(transactionId: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.findOne(transactionId);
    if (!transaction) {
      throw new AppError('Transaction not found.', 404);
    }

    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
