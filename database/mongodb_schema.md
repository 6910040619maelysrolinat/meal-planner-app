# MongoDB schema

The `meal_planner` database uses four collections: `activity_logs`, `recipe_reviews`, `shopping_carts`, and `notifications`.

Run `mongodb_init.js` once to create these collections and their user/time indexes. Each document is scoped to an application user through the numeric `userId` field. References such as `recipeId` point to SQL IDs at the application level; MongoDB does not enforce SQL foreign keys.

See `../docs/nosql-schema.md` for document examples and collection purposes.
