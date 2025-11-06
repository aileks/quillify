import { Navbar } from '@/components/navbar';

export default function Home() {
  return (
    <div className='min-h-screen bg-zinc-50 dark:bg-black'>
      <Navbar />
      <main className='flex min-h-[calc(100vh-73px)] flex-col items-center justify-center'>
        <h1 className='text-4xl font-bold'>Hello World!</h1>
      </main>
    </div>
  );
}
