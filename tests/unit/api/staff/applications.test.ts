import { describe, it } from 'vitest'

describe('staff applications API', () => {
  it.todo('PATCH approves application and sets status to APPROVED')
  it.todo('PATCH rejects application with a rejectionNote')
  it.todo('PATCH resubmit clears rejectionNote and sets status to SUBMITTED')
  it.todo('returns 403 when caller is not STAFF or ADMIN')
})
