# Quillify Competitive Feature Roadmap

## Executive Summary

- **Compete through focus.** Quillify should become an excellent private reading companion instead
  of matching the social breadth of Goodreads or Fable. Its strongest position is a calm, fast
  Library that helps readers capture books, choose what to read, and remember their reading.
- **Build trustworthy foundations first.** Richer reading states, dates, import and export, faster
  catalog capture, and flexible organization unlock nearly every later feature. These should come
  before goals, advanced statistics, or recommendations.
- **Deepen the reading loop next.** Progress updates, private notes, ratings, goals, and useful
  summaries give readers a reason to return without making reading feel like administrative work.
- **Add intelligence and sharing selectively.** Explainable recommendations, next-read tools, and
  revocable shared lists can differentiate Quillify while preserving privacy and simplicity.

## The "Why"

Quillify already provides a strong base for a personal library:

- Search, genre and status filters, sorting, bulk deletion, and 12-book pagination
- Shared, validated add and edit flows
- `To Read` and `Finished` states with optimistic updates
- Open Library cover search and selection
- Totals, pages read, top genres, publication range, and recent additions
- Responsive authenticated web experience and account management

The current model stores one book record per user with descriptive metadata and a binary Finished
state. It does not retain reading history, progress, ratings, notes, goals, custom organization, or
portable backups. Those gaps limit the value of the dashboard and leave little reason to return
between adding and finishing a book.

Current-state references: [project overview](../README.md), [routes and procedures](./ROUTES.md), and
[database schema](./SCHEMA.md).

## Comparison to Similar Apps

The strongest competitors combine library management with deeper tracking, discovery, or
community. Quillify does not need every feature they offer, but it should meet the core expectations
of a modern personal tracker.

| Product                                                 | Selected strengths                                                                                                                                                                                                                                                                                                                                              | Implication for Quillify                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Goodreads](https://www.goodreads.com/about/us)         | Large review community, friends, personalized recommendations, and custom shelves; its 2026 reading experience also includes [challenges](https://www.goodreads.com/blog/show/3144-join-the-goodreads-reading-challenge) and a dedicated [Did Not Finish state](https://www.goodreads.com/blog/show/3115-new-top-requested-reader-feature-did-not-finish-shelf) | Match essential tracking and portability, but avoid competing on community scale         |
| [The StoryGraph](https://thestorygraph.com/)            | Detailed statistics, custom tags and lists, Reading and Did Not Finish states, a private journal, goals, an Up Next queue, Goodreads import, and mood-based recommendations                                                                                                                                                                                     | This is the clearest personal-tracking benchmark                                         |
| [Hardcover](https://hardcover.app/)                     | Want to Read, Reading, Read, and Did Not Finish tracking with optional sharing and discovery                                                                                                                                                                                                                                                                    | Privacy can remain the default while sharing stays available                             |
| [Fable](https://help.fable.co/article/11-what-is-fable) | Custom private or shared lists, notes, social feeds, book clubs, and curated discovery                                                                                                                                                                                                                                                                          | Lists and reflections are useful; feeds and clubs are outside Quillify's near-term focus |

The comparison is feature-based, not a product-quality ranking. Competitor capabilities can change
after this planning snapshot.

## Recommended Roadmap

### Now: Make the Library Complete and Portable

These features remove adoption barriers and establish the data needed by every later phase.

#### 1. Complete Reading Lifecycle

**User problem:** A binary `To Read` or `Finished` state cannot represent active, paused, abandoned, or
repeated reading. It also loses when reading happened.

**Implemented foundation:** Books now have a guided five-state lifecycle, ownership, optional format
and calendar dates, and preserved reading periods. Finished and Did Not Finish books can start a new
To Read or Reading period without overwriting earlier history. Readers can correct dates, format,
and completed outcomes from the book detail page.

**Planned experience:**

- Keep the established `To Read` and `Finished` language.
- Add Reading, Paused, and Did Not Finish states.
- Record optional started and finished dates.
- Support rereads as separate reading periods rather than overwriting earlier history.
- Record format per reading period: print, ebook, or audiobook.
- Track ownership separately from reading state.
- Preserve notes, progress, and dates when a state changes.

**Why now:** Progress, goals, time-based statistics, wrap-ups, and recommendations all depend on
accurate lifecycle history.

**Relative effort:** Large. This is the main domain-model foundation.

**Success signals:** Readers use more than two states, completed books have usable dates, and state
changes do not lose history.

#### 2. Catalog-First Book Capture

**User problem:** Readers must enter metadata manually before Quillify can help identify a book.
This makes building a new Library slow and error-prone.

**Implemented foundation:** The add flow searches Open Library by title, author, or ISBN before
manual entry. Selecting a result prefills available title, author, publication year, page count, and
cover metadata while keeping every field editable. Manual entry remains available when catalog
metadata is missing or incorrect.

**Still planned:** Persisted ISBN and edition identity, format metadata, duplicate warnings, and
camera barcode scanning.

**Planned experience:**

- Search by title, author, or ISBN before opening the manual form.
- Selecting a catalog result prefills title, author, publication year, page count, ISBN, edition,
  format, and cover when available.
- Keep manual entry as a clear fallback for missing or incorrect catalog records.
- Warn about likely duplicates before saving, with an explicit option to add another edition.
- Add camera barcode scanning after the ISBN flow works reliably without camera access.

**Why now:** Fast capture improves first-use value and makes imports, editions, ownership, and
mobile workflows easier to support.

**Dependencies:** Extend the existing server-side Open Library integration. Define book identity
and edition matching before duplicate detection.

**Relative effort:** Medium for search and prefill; medium for barcode scanning after the ISBN path.

**Success signals:** Lower time to add a book, fewer abandoned add flows, fewer accidental
duplicates, and high catalog-match acceptance.

#### 3. Import, Export, and Backup

**User problem:** Readers with an existing history face too much manual work to adopt Quillify, and
readers cannot independently back up their data.

**Planned experience:**

- Import Goodreads CSV exports first, then support StoryGraph-compatible exports.
- Preview matched, unmatched, duplicate, and invalid rows before committing an import.
- Let readers correct uncertain matches or keep the source metadata as manual records.
- Make imports idempotent so retrying a file does not duplicate successful rows.
- Export books, editions, reading periods, progress, ratings, tags, lists, and notes in documented
  portable formats as those capabilities become available.
- Provide full account export from Settings without requiring support.

**Why now:** Portability removes a major switching barrier and creates trust before users invest in
deeper tracking.

**Dependencies:** Complete Reading Lifecycle and a stable identity strategy for books and editions.

**Relative effort:** Large because matching, validation, retries, and error reporting must be safe.

**Success signals:** Import completion rate, match correction rate, duplicate rate after import,
export success rate, and time from registration to a useful Library.

#### 4. Tags, Lists, and Up Next

**User problem:** Genre alone cannot capture themes, ownership, book-club picks, recommendations,
priority, or other personal organization.

**Planned experience:**

- Add reusable private tags that work across search and filters.
- Add named, ordered lists for curated groups of books.
- Provide a dedicated Up Next queue with a small default maximum, initially five books.
- Keep genre as descriptive book metadata rather than turning genres into user-owned tags.
- Make bulk tag and list changes available from the existing Library selection mode.

**Why now:** Organization improves large Libraries immediately and supplies useful preference data
for later statistics and recommendations.

**Dependencies:** Book identity should be settled first. Sharing remains excluded from this phase.

**Relative effort:** Medium.

**Success signals:** Tag and list adoption among established Libraries, repeated use of saved
filters, and books moving from Up Next into Reading.

### Next: Support the Active Reading Habit

These features turn Quillify from a static catalog into a useful reading companion.

#### 5. Progress Tracking and Private Journal

**User problem:** Quillify disappears between starting and finishing a book, and readers have no
place to retain thoughts tied to their progress.

**Planned experience:**

- Log progress by page, percentage, or listening minutes according to format.
- Show current progress and the last update on the dashboard and book detail page.
- Save an optional private note or quotation with each progress update.
- Allow backdated entries and corrections without silently rewriting history.
- Suggest state changes when progress begins or reaches completion, while leaving the reader in
  control.
- Avoid mandatory daily check-ins and default reminders.

**Dependencies:** Complete Reading Lifecycle and format-aware reading periods.

**Relative effort:** Large.

**Success signals:** Progress updates per active reader, completion of started books, journal reuse,
and low correction or deletion rates for entries.

#### 6. Ratings and Private Reflections

**User problem:** `Finished` only records completion. It does not help readers remember how they felt
or build a reliable picture of their taste.

**Planned experience:**

- Add optional half-star ratings.
- Add a private reflection that can be edited after finishing.
- Keep ratings and reflections attached to each reading period so rereads can differ.
- Offer lightweight prompts only when useful, such as favorite aspect or who might enjoy the book.
- Keep all content private unless a later sharing action explicitly includes it.

**Dependencies:** Complete Reading Lifecycle.

**Relative effort:** Medium.

**Success signals:** Rating and reflection completion among `Finished` books, repeat edits after
rereads, and enough explicit taste data to support recommendations.

#### 7. Goals, Deeper Statistics, and Wrap-Ups

**User problem:** Current totals describe the Library but do not show reading patterns over time or
help readers pursue a personal goal.

**Planned experience:**

- Support annual and monthly goals for books, pages, or listening time.
- Show progress, expected pace, and remaining work without punitive language.
- Add monthly trends and breakdowns by genre, author, format, rating, and completion time.
- Let readers filter statistics by date range, tag, list, and format.
- Generate monthly and annual cover-based summaries that can be downloaded.
- Make streaks opt-in if later research shows demand. Do not use streak loss as pressure.

**Dependencies:** Dates, reading periods, progress history, formats, ratings, tags, and lists.

**Relative effort:** Large, delivered incrementally after the data is trustworthy.

**Success signals:** Goal creation and completion, repeat statistics visits, wrap-up downloads, and
continued progress logging. Establish baselines before setting numeric targets.

#### 8. Installable Mobile Web Experience

**User problem:** Adding a physical book or updating progress often happens away from a desktop.

**Planned experience:**

- Make Quillify installable as a Progressive Web App before investing in native applications.
- Optimize home-screen launch, quick add, barcode scan, and progress update flows.
- Cache the Library and active reads for read-only offline access.
- Queue carefully bounded offline progress updates only after conflict behavior is defined.
- Preserve full keyboard and responsive web support.

**Dependencies:** Catalog-first capture, ISBN lookup, and Progress Tracking.

**Relative effort:** Medium for installation and read-only caching; large for safe offline writes.

**Success signals:** Mobile share of progress updates, PWA installs, barcode completion rate, cache
reliability, and conflict-free synchronization.

### Later: Add Useful Intelligence and Controlled Sharing

These features should follow sufficient adoption and data quality. They should remain explainable,
optional, and private by default.

#### 9. Next-Read Decision Tools

**User problem:** A large `To Read` list creates choice overload even when it is well organized.

**Planned experience:**

- Filter candidates by length, genre, format, ownership, tags, and available reading time.
- Let readers choose a filtered random pick.
- Explain which filters made a book eligible.
- Allow a reader to skip a suggestion without changing ratings or recommendation preferences.
- Move the chosen book into Up Next or Reading in one action.

**Dependencies:** Tags, lists, formats, ownership, and Up Next.

**Relative effort:** Small to medium. This should use deterministic rules before personalization.

**Success signals:** Decision-tool completion, selected books moving to Reading, and repeat use.

#### 10. Explainable Personal Recommendations

**User problem:** Readers want discovery that reflects their taste without an opaque feed or a
large social network.

**Planned experience:**

- Use ratings, `Finished` books, tags, genres, authors, and explicit preferences.
- Show a short reason with every recommendation.
- Allow readers to exclude authors, genres, themes, formats, and already-known books.
- Collect positive and negative feedback to improve later results.
- Start with catalog similarity and transparent rules. Generative AI is not required.

**Dependencies:** Reliable catalog identity, ratings, sufficient reading history, and a way to
measure recommendation quality.

**Relative effort:** Large.

**Success signals:** Recommendation saves, dismissals, starts, completions, and explicit relevance
feedback. Recommendations should not launch without a quality baseline.

#### 11. Private-First Sharing

**User problem:** Readers sometimes want to share a curated list or summary without making their
entire Library public.

**Planned experience:**

- Create unlisted, revocable links for selected lists and wrap-ups.
- Preview exactly which fields, notes, and ratings will be visible before publishing.
- Keep the account and Library private by default.
- Allow export as an image or document when a public link is unnecessary.
- Exclude follower graphs, feeds, comments, and direct messages.

**Dependencies:** Lists, ratings, reflections, and wrap-ups. Sharing needs clear privacy controls and
abuse-resistant public pages.

**Relative effort:** Medium.

**Success signals:** Share creation, link revocation, shared-page visits, and absence of accidental
private-field exposure.

#### 12. Selective Reading Integrations

**User problem:** Manual progress entry becomes repetitive when reading already happens in another
service or device.

**Planned experience:**

- Evaluate e-reader, library, and retailer connections individually.
- Require stable official APIs, clear user consent, scoped permissions, and exportable data.
- Start with read-only imports or explicit synchronization actions.
- Show the source and last synchronization time for imported activity.
- Avoid integrations that require credential sharing, scraping, or fragile private APIs.

**Dependencies:** Demonstrated demand, stable reading history, conflict handling, and provider API
review.

**Relative effort:** Unknown until a provider is selected.

**Success signals:** Integration activation, successful synchronization, conflict rate, and support
burden.

## Recommended Sequence

1. Define book identity, editions, reading periods, and the expanded state model.
2. Deliver catalog-first capture and lifecycle tracking together.
3. Add safe Goodreads import and complete Quillify export.
4. Add tags, lists, ownership, and Up Next.
5. Build progress, journal, ratings, and private reflections on the stable history model.
6. Expand goals and statistics only after historical data is reliable.
7. Optimize the proven workflows for installable mobile use.
8. Validate deterministic next-read tools before investing in personalized recommendations.
9. Add controlled sharing or integrations only where user demand is demonstrated.

## Product Measures

No product analytics or user-research results are available in the repository. Baselines should be
measured before numeric targets are committed.

| Outcome             | Proposed measures                                                                      |
| ------------------- | -------------------------------------------------------------------------------------- |
| Faster activation   | Time to first five-book Library, add-flow completion, catalog-match acceptance         |
| Easier migration    | Import completion, uncertain matches corrected, duplicates after import                |
| Deeper engagement   | Reading-state adoption, progress updates, journal reuse, four-week retention           |
| Better organization | Tag and list adoption, saved-filter reuse, Up Next conversion to Reading               |
| Useful insight      | Goal creation and completion, statistics revisits, wrap-up downloads                   |
| Better decisions    | Next-read selections, recommendation saves, starts, completions, dismissals            |
| Stronger trust      | Export success, synchronization conflicts, privacy incidents, account deletion success |

Instrumentation should collect the minimum behavioral data needed for these measures, avoid book or
journal content, and document retention and deletion behavior.

## Intentionally Deferred

The following would expand Quillify beyond its focused personal-tracker position and should not be
planned without new evidence:

- Global activity feed, follower graph, comments, and direct messages
- Public profiles or public Libraries by default
- Book clubs, group moderation, and spoiler-aware discussions
- Built-in ebook reader or storefront
- Native mobile applications before the PWA validates mobile demand
- Paid tiers, advertising, affiliate commerce, or publisher promotion
- Generative AI features without a specific user problem and quality benchmark

## Further Questions Before Delivery Planning

- Which audience has the strongest unmet need: casual TBR keepers, high-volume trackers, or readers
  migrating from another service?
- Which import source represents the largest realistic adoption opportunity?
- How often do current users return between adding and finishing a book?
- Which fields do readers consider private, especially ratings, notes, and abandoned books?
- Are readers more motivated by flexible goals, passive summaries, or explicit streaks?
- Which mobile moments cause enough friction to justify offline writes or a future native app?

## Assumptions and Caveats

- The target product remains a focused personal tracker rather than a social reading platform.
- The roadmap is for internal product and engineering planning.
- Feature priority reflects competitive coverage, dependencies, addressability, and product fit. It
  is not backed by Quillify usage data, customer interviews, delivery estimates, or revenue data.
- Relative effort is directional and must be refined through technical discovery.
- Every future schema change remains append-only and must preserve existing Library data.
- New public or shared experiences require dedicated privacy, abuse, accessibility, and security
  review.
