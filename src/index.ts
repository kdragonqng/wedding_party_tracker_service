import express from "express";
import apiExpress from 'typescript-express-basic';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import { existsSync, readFileSync } from 'fs';
import { PublicController } from "./controllers/publicController";
import { AuthController } from './controllers/authController';
import { connectToDatabase, closeDatabase } from './db/mongo';

let app = apiExpress;
app.use(express.json());

/**
 * GET /health
 * @summary Health check for service availability
 * @tags System
 * @return {object} 200 - Service is healthy - application/json
 */

app.registerController(new PublicController());
app.registerController(new AuthController());

const port = 3000;
const options = {
    info: {
        version: '1.0.0',
        title: 'Wedding Party Tracker API',
        license: {
            name: 'MIT',
        },
    },
    security: {
    },
    baseDir: __dirname,
    // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
    filesPattern: './**/*.ts',
    // URL where SwaggerUI will be rendered
    swaggerUIPath: '/api-docs',
    // Expose OpenAPI UI
    exposeSwaggerUI: true,
    // Expose Open API JSON Docs documentation in `apiDocsPath` path.
    exposeApiDocs: false,
    // Open API JSON Docs endpoint.
    apiDocsPath: '/v3/api-docs',
    // Set non-required fields as nullable by default
    notRequiredAsNullable: false,
    // You can customize your UI options.
    // you can extend swagger-ui-express config. You can checkout an example of this
    // in the `example/configuration/swaggerOptions.js`
    swaggerUiOptions: {},
    // multiple option in case you want more that one instance
    multiple: true,
};
expressJSDocSwagger(app)(options);

// Lightweight loader for .env.local (avoids adding dotenv dependency)
function loadEnvLocal(): void {
    if (process.env.MONGODB_URI) return; // already set from environment
    const envPath = '.env.local';
    if (!existsSync(envPath)) return;
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

async function start() {
    loadEnvLocal();
    const uri = process.env.MONGODB_URI || '';
    const dbName = process.env.MONGODB_DB; // optional; defaults to driver's default when undefined

    try {
        await connectToDatabase(uri, dbName);
        console.log('[db]: MongoDB connected');
        // Ensure indexes needed by the app
        try {
            const { getDb } = await import('./db/mongo');
            const db = getDb();
            await db.collection('users').createIndex({ email: 1 }, { unique: true });
            console.log('[db]: Ensured indexes');
        } catch (e) {
            console.warn('[db]: Index ensure skipped:', e);
        }
    } catch (err) {
        console.error('[db]: MongoDB connection failed:', err);
        process.exit(1);
    }

    const server = app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
    });

    const shutdown = async () => {
        console.log('\n[server]: Shutting down...');
        await closeDatabase();
        server.close(() => process.exit(0));
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

start();
