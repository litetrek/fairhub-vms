import { test } from '@playwright/test'

test.describe('Vendor application form', () => {
  test.fixme('authenticated vendor can reach /vendor/applications/new', async () => {})
  test.fixme('multi-step form saves a DRAFT on first step', async () => {})
  test.fixme('vendor can submit application and see SUBMITTED status', async () => {})
  test.fixme('vendor can re-edit a REJECTED application', async () => {})
  test.fixme('unauthenticated visitor is redirected to /auth/login', async () => {})
})
