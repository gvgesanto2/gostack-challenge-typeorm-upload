import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface ServiceRequest {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: ServiceRequest): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactionToDelete = await transactionsRepository.findOne({
      where: { id },
    });

    if (!transactionToDelete) {
      throw new AppError('No transaction found with this ID', 404);
    }

    await transactionsRepository.remove(transactionToDelete);
  }
}

export default DeleteTransactionService;
