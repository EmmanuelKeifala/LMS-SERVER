import {Document, Model} from 'mongoose';

interface MonthData {
  month: string;
  count: number;
}

export async function generateLast12MonthData<T extends Document>(
  model: Model<T>,
): Promise<{last12Months: MonthData[]}> {
  const last12Months = await model.aggregate([]);
  const currenDate = new Date();
  currenDate.setDate(currenDate.getDate() + 1);

  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(
      currenDate.getFullYear(),
      currenDate.getMonth(),
      currenDate.getDate() - i * 28,
      1,
    );
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - 28,
    );

    const monthYear = endDate.toLocaleDateString('default', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const count = await model.countDocuments({
      createdAt: {$gte: startDate, $lte: endDate},
    });
    last12Months.push({month: monthYear, count});
  }

  return {
    last12Months,
  };
}
