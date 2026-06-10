import { test } from '@playwright/test'

test.describe('Auth flows', () => {
  test.fixme('vendor can register with email and password', async () => {})
  test.fixme('vendor can log in with valid credentials', async () => {})
  test.fixme('invalid credentials show an error message', async () => {})
  test.fixme('logged-in vendor is redirected away from /auth/login', async () => {})
  test.fixme('staff login lands on /staff/queue', async () => {})
  test.fixme('admin login lands on /admin/events', async () => {})
})
