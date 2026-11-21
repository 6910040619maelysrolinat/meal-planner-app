# NoSQL design

MongoDB database `meal_planner` contains four collections. `database/mongodb_init.js` creates them and adds indexes on `userId` and `createdAt`.

## Collections

| Collection | Example document fields | Purpose |
|---|---|---|
| `activity_logs` | `userId`, `action`, `entity`, `entityId`, `details`, `createdAt` | Audit trail and transaction events |
| `recipe_reviews` | `userId`, `recipeId`, `rating`, `comment`, `createdAt` | Flexible recipe feedback |
| `shopping_carts` | `userId`, `items[]`, `createdAt` | Flexible arrays of shopping items |
| `notifications` | `userId`, `message`, `type`, `read`, `createdAt` | User-facing status messages |

## Example documents

```javascript
// recipe_reviews
{ userId: 7, recipeId: 12, rating: 5, comment: "Easy to prepare", createdAt: ISODate() }

// shopping_carts
{ userId: 7, items: [{ name: "Oats", quantity: 2, unit: "packs" }], createdAt: ISODate() }

// notifications
{ userId: 7, message: "Meal plan confirmed", type: "success", read: false, createdAt: ISODate() }

// activity_logs
{ userId: 7, action: "MEAL_PLAN_CONFIRMED", entity: "meal_plan", entityId: 4, details: { status: "committed" }, createdAt: ISODate() }
```

MongoDB references SQL entities by numeric IDs. These are application-level references, not cross-database foreign keys. All four collections have user-scoped CRUD API routes. Transaction-generated audit events are inserted by the backend.
