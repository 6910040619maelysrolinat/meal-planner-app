// Run with: mongosh meal_planner database/mongodb_init.js
const requiredCollections = [
  "activity_logs",
  "recipe_reviews",
  "shopping_carts",
  "notifications"
];

for (const name of requiredCollections) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name);
  }
}

// Each user's newest activity and documents can be queried efficiently.
db.activity_logs.createIndex({ userId: 1, createdAt: -1 });
db.recipe_reviews.createIndex({ userId: 1, createdAt: -1 });
db.shopping_carts.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, createdAt: -1 });

print("Meal Planner MongoDB collections and indexes are ready.");
