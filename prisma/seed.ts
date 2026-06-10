import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
})

async function main() {
  const event = await prisma.event.upsert({
    where: { publicSlug: 'summer-fair-2026' },
    update: {},
    create: {
      name: 'Summer Fair 2026',
      description:
        'Our annual community summer fair featuring food, crafts, and local vendors for the whole family!',
      publicSlug: 'summer-fair-2026',
      status: 'OPEN',
      eventDateStart: new Date('2026-07-04'),
      eventDateEnd: new Date('2026-08-31'),
      hours: '10am – 8pm',
      address: '123 Main Street',
      city: 'Springfield',
      state: 'CA',
    },
  })
  console.log('Event:', event.name)

  const weeksData = [
    {
      label: 'Week 1 (Jul 4–6)',
      startDate: new Date('2026-07-04'),
      endDate: new Date('2026-07-06'),
      sortOrder: 1,
    },
    {
      label: 'Week 2 (Jul 11–13)',
      startDate: new Date('2026-07-11'),
      endDate: new Date('2026-07-13'),
      sortOrder: 2,
    },
    {
      label: 'Week 3 (Jul 18–20)',
      startDate: new Date('2026-07-18'),
      endDate: new Date('2026-07-20'),
      sortOrder: 3,
    },
  ]

  for (const week of weeksData) {
    const existing = await prisma.eventWeek.findFirst({
      where: { eventId: event.id, label: week.label },
    })
    if (!existing) {
      await prisma.eventWeek.create({ data: { ...week, eventId: event.id } })
    }
    console.log('Week:', week.label)
  }

  const boothTypesData = [
    {
      name: 'Food Vendor',
      description:
        'Perfect for food sellers and caterers. Includes access to electricity and water hookups.',
      basePrice: 150,
      sizeSqft: 100,
      totalCount: 10,
      sortOrder: 1,
      docs: [
        { docType: 'BUSINESS_LICENSE' as const, required: true },
        { docType: 'HEALTH_PERMIT' as const, required: true },
        { docType: 'INSURANCE' as const, required: true },
      ],
    },
    {
      name: 'Craft Booth',
      description: 'Ideal for artisans, makers, and craft sellers.',
      basePrice: 100,
      sizeSqft: 64,
      totalCount: 15,
      sortOrder: 2,
      docs: [{ docType: 'BUSINESS_LICENSE' as const, required: true }],
    },
    {
      name: 'Commercial',
      description:
        'For established businesses and commercial vendors with large inventory.',
      basePrice: 200,
      sizeSqft: 144,
      totalCount: 5,
      sortOrder: 3,
      docs: [
        { docType: 'BUSINESS_LICENSE' as const, required: true },
        { docType: 'SELLERS_PERMIT' as const, required: true },
        { docType: 'INSURANCE' as const, required: true },
      ],
    },
  ]

  for (const btData of boothTypesData) {
    const { docs, ...rest } = btData
    const existing = await prisma.boothType.findFirst({
      where: { eventId: event.id, name: rest.name },
    })
    if (!existing) {
      await prisma.boothType.create({
        data: {
          ...rest,
          eventId: event.id,
          docRequirements: { create: docs },
        },
      })
    }
    console.log('BoothType:', rest.name)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
