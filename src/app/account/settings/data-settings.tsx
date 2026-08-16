'use client';

import { useState } from 'react';
import { Download, FileUp, LibraryBig } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BOOK_MAX_PAGE_COUNT,
  BOOK_MIN_PUBLISH_YEAR,
  getMaximumPublishYear,
} from '@/lib/book-validation';
import { api } from '@/trpc/react';
import type { RouterOutputs } from '@/trpc/react';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ROWS_PER_PAGE = 50;

type PreviewResult = RouterOutputs['dataTransfer']['previewGoodreadsImport'];
type PreviewRow = PreviewResult['rows'][number];
type EditablePreviewRow = Omit<PreviewRow, 'numberOfPages' | 'publishYear'> & {
  numberOfPages: string;
  publishYear: string;
};

const STATUS_LABELS = {
  ready: 'Ready',
  needs_attention: 'Needs Attention',
  likely_duplicate: 'Likely Duplicate',
  already_imported: 'Already Imported',
  invalid: 'Invalid',
} satisfies Record<PreviewRow['previewStatus'], string>;

function isCorrectedRowValid(row: EditablePreviewRow): boolean {
  const numberOfPages = Number(row.numberOfPages);
  const publishYear = Number(row.publishYear);
  return (
    Number.isInteger(numberOfPages) &&
    numberOfPages >= 1 &&
    numberOfPages <= BOOK_MAX_PAGE_COUNT &&
    Number.isInteger(publishYear) &&
    publishYear >= BOOK_MIN_PUBLISH_YEAR &&
    publishYear <= getMaximumPublishYear()
  );
}

function canSelectRow(row: EditablePreviewRow): boolean {
  return (
    row.previewStatus !== 'invalid' &&
    row.previewStatus !== 'already_imported' &&
    isCorrectedRowValid(row)
  );
}

export function DataSettings() {
  const utils = api.useUtils();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<EditablePreviewRow[] | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [previewPage, setPreviewPage] = useState(0);

  const previewImport = api.dataTransfer.previewGoodreadsImport.useMutation({
    onSuccess: (result) => {
      setPreviewPage(0);
      setPreviewRows(
        result.rows.map((row) => ({
          ...row,
          numberOfPages: row.numberOfPages?.toString() ?? '',
          publishYear: row.publishYear?.toString() ?? '',
        }))
      );
      setSelectedSourceIds(
        result.rows
          .filter((row) => row.previewStatus === 'ready')
          .map(({ sourceRecordId }) => sourceRecordId)
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const importBooks = api.dataTransfer.importGoodreads.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Imported ${result.created} ${result.created === 1 ? 'book' : 'books'}` +
          (result.skipped > 0 ? `. Skipped ${result.skipped}.` : '')
      );
      setPreviewRows(null);
      setSelectedSourceIds([]);
      setSelectedFile(null);
      void utils.books.list.invalidate();
      void utils.books.stats.invalidate();
    },
    onError: (error) => {
      toast.error(
        error.message === 'BOOK_LIMIT_REACHED' ?
          'Verify your email before importing more than 10 books.'
        : error.message
      );
    },
  });

  const previewSelectedFile = async () => {
    if (!selectedFile) return;
    if (selectedFile.size > MAX_FILE_BYTES) {
      toast.error('Goodreads CSV must be 5 MiB or smaller.');
      return;
    }

    previewImport.mutate({ csv: await selectedFile.text() });
  };

  const updateRow = (
    sourceRecordId: string,
    field: 'numberOfPages' | 'publishYear',
    value: string
  ) => {
    setPreviewRows(
      (rows) =>
        rows?.map((row) =>
          row.sourceRecordId === sourceRecordId ? { ...row, [field]: value } : row
        ) ?? null
    );
  };

  const toggleRow = (sourceRecordId: string, isSelected: boolean) => {
    setSelectedSourceIds((sourceIds) =>
      isSelected ?
        sourceIds.includes(sourceRecordId) ?
          sourceIds
        : [...sourceIds, sourceRecordId]
      : sourceIds.filter((currentId) => currentId !== sourceRecordId)
    );
  };

  const commitImport = () => {
    if (!previewRows) return;

    const rows = previewRows
      .filter((row) => selectedSourceIds.includes(row.sourceRecordId) && canSelectRow(row))
      .map((row) => ({
        sourceRecordId: row.sourceRecordId,
        title: row.title,
        author: row.author,
        numberOfPages: Number(row.numberOfPages),
        publishYear: Number(row.publishYear),
        isbn10: row.isbn10,
        isbn13: row.isbn13,
        readingStatus: row.readingStatus,
        readingFormat: row.readingFormat,
        endedOn: row.endedOn,
        ownershipType: row.ownershipType,
        tags: row.tags,
        importAsSeparateEdition: row.previewStatus === 'likely_duplicate',
      }));

    if (rows.length === 0) {
      toast.error('Select at least one ready book.');
      return;
    }
    importBooks.mutate({ rows });
  };

  const totalPreviewPages = Math.max(1, Math.ceil((previewRows?.length ?? 0) / ROWS_PER_PAGE));
  const visibleRows = previewRows?.slice(
    previewPage * ROWS_PER_PAGE,
    (previewPage + 1) * ROWS_PER_PAGE
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import from Goodreads</CardTitle>
          <CardDescription>
            Add books from a Goodreads library export. CSV files may contain up to 10,000 books or 5
            MiB.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='goodreads-csv'>Goodreads CSV</Label>
            <Input
              id='goodreads-csv'
              type='file'
              accept='.csv,text/csv'
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              disabled={previewImport.isPending}
            />
          </div>
          <p className='text-muted-foreground text-sm'>
            Your Goodreads shelves become tags on each book. Ratings, reviews, private notes, and
            additional reread history are not imported in this release.
          </p>
          <Button
            type='button'
            className='w-fit'
            onClick={previewSelectedFile}
            disabled={!selectedFile || previewImport.isPending}
          >
            <FileUp data-icon='inline-start' />
            {previewImport.isPending ? 'Reading CSV...' : 'Preview Import'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Download Backup</CardTitle>
          <CardDescription>
            Save a versioned JSON copy of your account, Library, tags, lists, Up Next queue, reading
            history, catalog IDs, and import history.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <Button asChild className='w-fit'>
            <a href='/api/export' download>
              <Download data-icon='inline-start' />
              Download Backup
            </a>
          </Button>
          <p className='text-muted-foreground text-sm'>
            Backups never include your password or account tokens. Restore support is planned for a
            later release.
          </p>
        </CardContent>
      </Card>

      <Dialog open={previewRows !== null} onOpenChange={(open) => !open && setPreviewRows(null)}>
        <DialogContent className='max-h-[90vh] overflow-hidden sm:max-w-[min(1100px,calc(100%-2rem))]'>
          <DialogHeader>
            <DialogTitle>Review Goodreads Import</DialogTitle>
            <DialogDescription>
              Correct missing pages or years. Duplicate books remain unselected unless you choose to
              add them as another edition.
            </DialogDescription>
          </DialogHeader>

          <div className='overflow-auto rounded-sm border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10'>
                    <span className='sr-only'>Import</span>
                  </TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows?.map((row) => {
                  const canSelect = canSelectRow(row);
                  return (
                    <TableRow key={`${row.rowNumber}-${row.sourceRecordId}`}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Import ${row.title || `row ${row.rowNumber}`}`}
                          checked={selectedSourceIds.includes(row.sourceRecordId)}
                          onCheckedChange={(checked) =>
                            toggleRow(row.sourceRecordId, checked === true)
                          }
                          disabled={!canSelect}
                        />
                      </TableCell>
                      <TableCell className='max-w-72 whitespace-normal'>
                        <p className='font-medium'>{row.title || `Row ${row.rowNumber}`}</p>
                        <p className='text-muted-foreground text-xs'>{row.author}</p>
                        {row.tags.length > 0 && (
                          <p className='text-muted-foreground mt-1 text-xs'>
                            Tags: {row.tags.join(', ')}
                          </p>
                        )}
                        {row.issues.length > 0 && (
                          <p className='text-muted-foreground mt-1 text-xs'>
                            {row.issues.join(', ')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.previewStatus === 'invalid' ? 'destructive' : 'outline'}
                        >
                          {STATUS_LABELS[row.previewStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          className='w-24'
                          inputMode='numeric'
                          aria-label={`Pages for ${row.title || `row ${row.rowNumber}`}`}
                          value={row.numberOfPages}
                          onChange={(event) =>
                            updateRow(row.sourceRecordId, 'numberOfPages', event.target.value)
                          }
                          disabled={
                            row.previewStatus === 'invalid' ||
                            row.previewStatus === 'already_imported'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className='w-24'
                          inputMode='numeric'
                          aria-label={`Publication year for ${row.title || `row ${row.rowNumber}`}`}
                          value={row.publishYear}
                          onChange={(event) =>
                            updateRow(row.sourceRecordId, 'publishYear', event.target.value)
                          }
                          disabled={
                            row.previewStatus === 'invalid' ||
                            row.previewStatus === 'already_imported'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPreviewPages > 1 && (
            <div className='flex items-center justify-between gap-3'>
              <p className='text-muted-foreground text-sm'>
                Page {previewPage + 1} of {totalPreviewPages}
              </p>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => setPreviewPage((page) => Math.max(0, page - 1))}
                  disabled={previewPage === 0}
                >
                  Previous
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() =>
                    setPreviewPage((page) => Math.min(totalPreviewPages - 1, page + 1))
                  }
                  disabled={previewPage === totalPreviewPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setPreviewRows(null)}
              disabled={importBooks.isPending}
            >
              Cancel
            </Button>
            <Button type='button' onClick={commitImport} disabled={importBooks.isPending}>
              <LibraryBig data-icon='inline-start' />
              {importBooks.isPending ?
                'Importing...'
              : `Import ${selectedSourceIds.length} ${selectedSourceIds.length === 1 ? 'Book' : 'Books'}`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
