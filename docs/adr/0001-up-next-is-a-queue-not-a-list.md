# Up Next is a queue, not a list

Up Next behaves as a queue with its own rules - a hard cap of five, automatic removal when a book moves to Reading, Paused, Finished, or Did Not Finish, and no name of its own - so it is modeled as its own concept rather than a system-owned List. Implementing it as a flagged List row would push cap, eviction, and no-rename/delete special cases through every layer that touches lists.
