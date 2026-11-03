"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
const net = __importStar(require("net"));
const pg_1 = require("pg");
const env_1 = require("./../config/env");
// Give each connection attempt 2s instead of Node's default 250ms
// (a round trip from South Africa to Neon in Virginia takes ~250–300ms)
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 80000, // close unused connections after 30s
    connectionTimeoutMillis: 80000, // wait up to 15s for a new connection
    // :arrow_down: Stripped down to be 100% foolproof for Render
    ssl: { rejectUnauthorized: false },
});
exports.pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err.message);
});
const query = (text, params) => exports.pool.query(text, params);
exports.query = query;
