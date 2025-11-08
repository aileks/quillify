import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, books } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

const DEMO_USER = {
  email: 'demo@quillify.com',
  password: 'demo123',
  confirmPassword: 'demo123',
  name: 'Demo User',
};

const DEMO_BOOKS = [
  {
    title: '1984',
    author: 'George Orwell',
    numberOfPages: 328,
    genre: 'Fiction',
    publishYear: 1949,
    isRead: true,
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    numberOfPages: 310,
    genre: 'Fantasy',
    publishYear: 1937,
    isRead: true,
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    numberOfPages: 688,
    genre: 'Science Fiction',
    publishYear: 1965,
    isRead: false,
  },
  {
    title: 'And Then There Were None',
    author: 'Agatha Christie',
    numberOfPages: 272,
    genre: 'Mystery',
    publishYear: 1939,
    isRead: true,
  },
  {
    title: 'The Girl with the Dragon Tattoo',
    author: 'Stieg Larsson',
    numberOfPages: 465,
    genre: 'Thriller',
    publishYear: 2005,
    isRead: false,
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    numberOfPages: 432,
    genre: 'Romance',
    publishYear: 1813,
    isRead: true,
  },
  {
    title: 'Dracula',
    author: 'Bram Stoker',
    numberOfPages: 418,
    genre: 'Horror',
    publishYear: 1897,
    isRead: false,
  },
  {
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    numberOfPages: 656,
    genre: 'Biography',
    publishYear: 2011,
    isRead: true,
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    numberOfPages: 443,
    genre: 'History',
    publishYear: 2011,
    isRead: true,
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    numberOfPages: 256,
    genre: 'Science',
    publishYear: 1988,
    isRead: false,
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    numberOfPages: 320,
    genre: 'Self-Help',
    publishYear: 2018,
    isRead: true,
  },
  {
    title: 'The Waste Land and Other Poems',
    author: 'T.S. Eliot',
    numberOfPages: 88,
    genre: 'Poetry',
    publishYear: 1922,
    isRead: false,
  },
  {
    title: 'Death of a Salesman',
    author: 'Arthur Miller',
    numberOfPages: 139,
    genre: 'Drama',
    publishYear: 1949,
    isRead: true,
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    numberOfPages: 334,
    genre: 'Non-Fiction',
    publishYear: 2018,
    isRead: true,
  },
  {
    title: 'The Da Vinci Code',
    author: 'Dan Brown',
    numberOfPages: 454,
    genre: 'Thriller',
    publishYear: 2003,
    isRead: false,
  },
];

async function seed() {
  try {
    console.log('Seeding demo user and books...');

    // Check if demo user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, DEMO_USER.email));

    let demoUser: typeof existingUser;

    if (existingUser) {
      console.log('Demo user already exists!');
      demoUser = existingUser;
    } else {
      // Create demo user
      const hashedPassword = await bcrypt.hash(DEMO_USER.password, 12);
      const [newUser] = await db
        .insert(users)
        .values({
          email: DEMO_USER.email,
          password: hashedPassword,
          name: DEMO_USER.name,
        })
        .returning();
      demoUser = newUser;
      console.log('Created demo user');
    }

    // Check if books already exist for this user
    const existingBooks = await db.select().from(books).where(eq(books.userId, demoUser!.id));

    if (existingBooks.length > 0) {
      console.log(`Demo user already has ${existingBooks.length} books. Skipping book creation.`);
      console.log('Delete existing books first if you want to re-seed.');
    } else {
      // Create books
      for (const book of DEMO_BOOKS) {
        await db.insert(books).values({
          userId: demoUser!.id,
          ...book,
        });
      }
      console.log(`Created ${DEMO_BOOKS.length} books`);
    }

    console.log('\nSeeding complete!');
    console.log(`\nDemo credentials:`);
    console.log(`   Email: ${DEMO_USER.email}`);
    console.log(`   Password: ${DEMO_USER.password}`);
    console.log(
      `   Books: ${DEMO_BOOKS.length} (${DEMO_BOOKS.filter((b) => b.isRead).length} read, ${DEMO_BOOKS.filter((b) => !b.isRead).length} unread)`
    );
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
