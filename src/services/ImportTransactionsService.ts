import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface CSVData {
  transactionsCSV: CSVTransaction[];
  categoriesCSV: string[];
}

const extractTransactionsAndCategoriesFromCSV = async (
  filePath: string,
): Promise<CSVData> => {
  const contactReadStream = fs.createReadStream(filePath);
  const parser = csvParse({
    from_line: 2,
  });

  const csvParser = contactReadStream.pipe(parser);

  const transactionsCSV: CSVTransaction[] = [];
  const categoriesCSV: string[] = [];

  csvParser.on('data', async line => {
    const [title, type, value, category] = line.map((cell: string) =>
      cell.trim(),
    );

    if (!title || !type || !value) return;

    categoriesCSV.push(category);

    transactionsCSV.push({ title, type, value, category });
  });

  await new Promise(resolve => csvParser.on('end', resolve));

  return {
    transactionsCSV,
    categoriesCSV,
  };
};

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const {
      transactionsCSV,
      categoriesCSV,
    } = await extractTransactionsAndCategoriesFromCSV(filePath);

    const existingCategories = await categoriesRepository.find({
      where: {
        title: In(categoriesCSV),
      },
    });

    const existingCategoriesTitles = existingCategories.map(
      (category: Category) => category.title,
    );

    const categoryTitlesToAdd = categoriesCSV
      .filter(category => !existingCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoryTitlesToAdd.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...existingCategories, ...newCategories];

    const createdTransactions = transactionsRepository.create(
      transactionsCSV.map(({ title, type, value, category }) => ({
        title,
        type,
        value,
        category: finalCategories.find(
          finalCategory => finalCategory.title === category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
