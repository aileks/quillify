import { NewBookForm } from './new-book-form';
import { pickRandomSaying } from '@/lib/product-sayings';

export const metadata = {
  title: 'Add a Book',
};

export default function NewBookPage() {
  return <NewBookForm saying={pickRandomSaying('addBook')} />;
}
