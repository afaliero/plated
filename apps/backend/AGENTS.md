# Backend Instructions

- For local development, backend startup must run both migrations and seeds. Keep reseeding on restart until the user explicitly requests changing this behavior for a hosted database.
- When writing tests, only add the minimum number of cases required to cover the happy path and any edge cases. Do not make tests overly verbose. For example if we're testing inserting into a table, and we already have tests for inserting into another table, do not add a new test.
- Add tests whenever it makes sense.
