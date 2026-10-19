import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env';
import { requireLogin, requireAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

// A stand-in for the server's answer, so we can see what the guards say
function fakeRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
}

function requestWithToken(token?: string) {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  return { headers } as unknown as AuthRequest;
}

test('a valid login token is let through', () => {
  const token = jwt.sign({ id: 1, role: 'user' }, env.JWT_SECRET);
  const req = requestWithToken(token);
  const res = fakeRes();
  let passed = false;

  requireLogin(req, res as unknown as Response, () => {
    passed = true;
  });

  assert.equal(passed, true);
  assert.equal(req.user?.id, 1);
});

test('a request with no token is refused', () => {
  const res = fakeRes();
  let passed = false;

  requireLogin(requestWithToken(), res as unknown as Response, () => {
    passed = true;
  });

  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

test('a token signed with the wrong secret is refused', () => {
  const fake = jwt.sign({ id: 1, role: 'admin' }, 'some-other-secret');
  const res = fakeRes();
  let passed = false;

  requireLogin(requestWithToken(fake), res as unknown as Response, () => {
    passed = true;
  });

  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

test('a normal guest is refused by the admin guard', () => {
  const req = { user: { id: 2, role: 'user' } } as unknown as AuthRequest;
  const res = fakeRes();
  let passed = false;

  requireAdmin(req, res as unknown as Response, () => {
    passed = true;
  });

  assert.equal(passed, false);
  assert.equal(res.statusCode, 403);
});

test('an admin is let through the admin guard', () => {
  const req = { user: { id: 1, role: 'admin' } } as unknown as AuthRequest;
  const res = fakeRes();
  let passed = false;

  requireAdmin(req, res as unknown as Response, () => {
    passed = true;
  });

  assert.equal(passed, true);
});