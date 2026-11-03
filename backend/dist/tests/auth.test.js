"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
// A stand-in for the server's answer, so we can see what the guards say
function fakeRes() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        },
    };
}
function requestWithToken(token) {
    const headers = token ? { authorization: `Bearer ${token}` } : {};
    return { headers };
}
(0, node_test_1.test)('a valid login token is let through', () => {
    const token = jsonwebtoken_1.default.sign({ id: 1, role: 'user' }, env_1.env.JWT_SECRET);
    const req = requestWithToken(token);
    const res = fakeRes();
    let passed = false;
    (0, auth_1.requireLogin)(req, res, () => {
        passed = true;
    });
    strict_1.default.equal(passed, true);
    strict_1.default.equal(req.user?.id, 1);
});
(0, node_test_1.test)('a request with no token is refused', () => {
    const res = fakeRes();
    let passed = false;
    (0, auth_1.requireLogin)(requestWithToken(), res, () => {
        passed = true;
    });
    strict_1.default.equal(passed, false);
    strict_1.default.equal(res.statusCode, 401);
});
(0, node_test_1.test)('a token signed with the wrong secret is refused', () => {
    const fake = jsonwebtoken_1.default.sign({ id: 1, role: 'admin' }, 'some-other-secret');
    const res = fakeRes();
    let passed = false;
    (0, auth_1.requireLogin)(requestWithToken(fake), res, () => {
        passed = true;
    });
    strict_1.default.equal(passed, false);
    strict_1.default.equal(res.statusCode, 401);
});
(0, node_test_1.test)('a normal guest is refused by the admin guard', () => {
    const req = { user: { id: 2, role: 'user' } };
    const res = fakeRes();
    let passed = false;
    (0, auth_1.requireAdmin)(req, res, () => {
        passed = true;
    });
    strict_1.default.equal(passed, false);
    strict_1.default.equal(res.statusCode, 403);
});
(0, node_test_1.test)('an admin is let through the admin guard', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = fakeRes();
    let passed = false;
    (0, auth_1.requireAdmin)(req, res, () => {
        passed = true;
    });
    strict_1.default.equal(passed, true);
});
