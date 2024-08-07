import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const user = pgTable('user', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    age: integer('age'),
});
