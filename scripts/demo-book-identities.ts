interface DemoBookIdentity {
  isbn10: string;
  isbn13: string;
  openLibraryWorkId?: string;
  openLibraryEditionId?: string;
}

export const DEMO_BOOK_IDENTITIES: Readonly<Record<string, DemoBookIdentity>> = {
  'Ways of Seeing': {
    isbn10: '0140135154',
    isbn13: '9780140135152',
  },
  'The Lean Startup': {
    isbn10: '0307887898',
    isbn13: '9780307887894',
  },
  'Zero to One': {
    isbn10: '0804139296',
    isbn13: '9780804139298',
  },
  'Pride and Prejudice': {
    isbn10: '0141439513',
    isbn13: '9780141439518',
  },
  'To Kill a Mockingbird': {
    isbn10: '0061120081',
    isbn13: '9780061120084',
  },
  'Jane Eyre': {
    isbn10: '0141441143',
    isbn13: '9780141441146',
    openLibraryWorkId: 'OL1095427W',
    openLibraryEditionId: 'OL22731948M',
  },
  'The Great Gatsby': {
    isbn10: '0743273567',
    isbn13: '9780743273565',
  },
  '1984': {
    isbn10: '0451524934',
    isbn13: '9780451524935',
  },
  'The Road': {
    isbn10: '0307387895',
    isbn13: '9780307387899',
  },
  'The Hobbit': {
    isbn10: '054792822X',
    isbn13: '9780547928227',
  },
  "Harry Potter and the Sorcerer's Stone": {
    isbn10: '059035342X',
    isbn13: '9780590353427',
  },
};
