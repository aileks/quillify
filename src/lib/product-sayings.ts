export const PRODUCT_SAYINGS = {
  home: [
    'A quiet shelf, a clear next chapter.',
    'The next great read is already waiting.',
    'A little progress still turns pages.',
    'Good books have a way of finding their moment.',
    'Make room for the story you cannot put down.',
    'One more chapter is a perfectly good plan.',
    'Your reading life, gathered in one place.',
    'Every finished book began as a maybe.',
    'Follow your curiosity. It knows the way.',
    'There is always another world between two covers.',
  ],
  library: [
    'Your next favorite is hiding somewhere on this shelf.',
    'A well-kept TBR makes choosing easy.',
    'Some books wait patiently. Others keep calling.',
    'Every unread book is a door left ajar.',
    'A shelf full of possibilities, minus the clutter.',
    'Keep the maybes close and the finished ones closer.',
    'The best next book is the one you want to open.',
    'A personal library should feel full of promise.',
    'Small shelf, big worlds.',
    'Choose a spine and see where it leads.',
  ],
  addBook: [
    'Add the book that keeps crossing your mind.',
    'Save this one before it slips off the TBR.',
    'Every library grows one good find at a time.',
    'A promising title deserves a place on the shelf.',
    'Make room for one more possibility.',
    'Capture the details. Keep the anticipation.',
    'The next chapter starts with adding the book.',
    'Give this book a proper place to wait.',
    'Turn a recommendation into a future read.',
    'One new book, one more world within reach.',
  ],
  editBook: [
    'Keep the details as sharp as the memory.',
    'A tidy catalog makes every book easier to find.',
    'Small corrections keep the shelf in order.',
    'Give this book the details it deserves.',
    'Straighten the record and return it to the shelf.',
    'A polished entry makes for a calmer library.',
    'Fine-tune the details without losing your place.',
    'Keep the title, author, and story aligned.',
    'Set the record right, then keep reading.',
    'A little shelfkeeping goes a long way.',
  ],
  lists: [
    'Curate a list and let it choose the moment.',
    'A good list turns maybes into plans.',
    'Group them by mood, by season, by whim.',
    'The right list finds the right book sooner.',
    'Every list is a small promise to yourself.',
    'Some books belong together for reasons of their own.',
    'A short list reads like an invitation.',
    'Line them up and let the order speak.',
    'Lists keep the shelf from whispering all at once.',
    'Arrange the next reads like a set list.',
  ],
} as const;

export type SayingCategory = keyof typeof PRODUCT_SAYINGS;

export function pickRandomSaying(category: SayingCategory): string {
  const sayings = PRODUCT_SAYINGS[category];
  const index = Math.floor(Math.random() * sayings.length);
  return sayings[index] ?? sayings[0];
}
