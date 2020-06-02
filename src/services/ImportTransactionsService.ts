import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';
import { getRepository, getCustomRepository, In } from 'typeorm';

import uploadConfig from '../config/upload';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface ImportTransactionsDTO {
  filename: string;
}

interface CreateTransactionDTO {
  title: string;
  value: number;
  type: string;
  category: string
}

class ImportTransactionsService {
  public async execute({
    filename
  }: ImportTransactionsDTO): Promise<Transaction[]> {
    // const createTransaction = new CreateTransactionService();

    // const filePath = path.join(uploadConfig.directory, filename);
    // const csvLines = await this.loadCSV(filePath);
    // console.log(csvLines);

    // const transactions = csvLines.transactions.map(async item => {
    //   const transaction = await createTransaction.execute(item);
    //   return transaction;
    // });

    // const transactionsCreated = await Promise.all(transactions);

    // return transactionsCreated;

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const filePath = path.join(uploadConfig.directory, filename);
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CreateTransactionDTO[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {

      const [ title, type, value, category ] = line.map((cell: string) => cell.trim());

      if ( !title || !type || !value ) return;

      categories.push(category);
      transactions.push({ title, type, value, category });

    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });


    const existentCategories = await categoriesRepository.find(({
      where: {
        title: In(categories),
      }
    }));

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );


    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [ ...newCategories, ...existentCategories ];


    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        )
      })),
    );

    await transactionsRepository.save(createdTransactions);
    await fs.promises.unlink(filePath);

    return createdTransactions;

  }
}

export default ImportTransactionsService;
