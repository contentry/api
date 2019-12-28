const config = require('config');
const db = config.get('db');

module.exports = {
    type: db.type || "mysql",
    host: db.host || "localhost",
    port: db.port || 3306,
    username: db.username || "root",
    password: db.password || "",
    database: db.database || "contentry",
    synchronize: db.synchronize || false,
    logging: db.logging || false,
    entities: ["dist/**/*.entity{.ts,.js}"],
    migrationsTableName: "custom_migration_table",
    migrations: ["dist/database/migrations/*{.ts,.js}"],
    cli: {
        entitiesDir: "src/**/*.entity.ts",
        migrationsDir: "src/database/migrations"
    },
};
