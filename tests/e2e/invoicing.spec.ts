import { test } from '@playwright/test'

test.describe('Invoicing', () => {
  test.fixme('staff can generate an invoice for an application with a booth assigned', async () => {})
  test.fixme('invoice shows correct line items and total', async () => {})
  test.fixme('staff can record an offline payment', async () => {})
  test.fixme('invoice status progresses DRAFT → SENT → PAID', async () => {})
  test.fixme('cannot generate invoice without a booth assignment', async () => {})
})
