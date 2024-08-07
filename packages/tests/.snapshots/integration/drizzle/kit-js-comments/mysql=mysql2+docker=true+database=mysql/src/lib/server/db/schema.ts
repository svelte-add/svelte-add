import { mysqlTable, serial, text, int } from "drizzle-orm/mysql-core";

export const user = mysqlTable('user', {
    id: serial("id").primaryKey(),
    name: text('name').notNull(),
    age: int('age'),
});
