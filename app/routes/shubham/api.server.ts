import { t } from '@/.server/trpc';
import { z } from 'zod';

// Mock data
const couriers = [
  {
    id: 3,
    name: 'Bob Johnson',
    phone: '(555) 345-6789',
    email: 'bob.johnson@example.com',
  },
  {
    id: 2,
    name: 'Jane Smith',
    phone: '(555) 234-5678',
    email: 'jane.smith@example.com',
  },
  {
    id: 1,
    name: 'John Doe',
    phone: '(555) 123-4567',
    email: 'john.doe@example.com',
  },
];

export default t.router({
  getCouriers: t.procedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
      })
    )
    .query(({ input }) => {
      // Mock search filter
      let filteredCouriers = couriers.filter((courier) =>
        input.search
          ? courier.name.toLowerCase().includes(input.search.toLowerCase())
          : true
      );

      // Mock pagination
      const startIndex = (input.page - 1) * input.pageSize;
      const paginatedCouriers = filteredCouriers.slice(
        startIndex,
        startIndex + input.pageSize
      );

      return {
        couriers: paginatedCouriers,
        totalCount: filteredCouriers.length,
      };
    }),

  getCourier: t.procedure.input(z.number()).query(({ input }) => {
    const courier = couriers.find((courier) => courier.id === input);
    if (!courier) {
      throw new Error('Courier not found');
    }

    return courier;
  }),

  createCourier: t.procedure
    .input(
      z.object({
        name: z.string(),
        phone: z.string(),
        email: z.string(),
      })
    )
    .mutation(({ input }) => {
      const id = couriers.length > 0 ? couriers[0]?.id + 1 : 1;
      couriers.unshift({ id, ...input });

      return { id };
    }),

  updateCourier: t.procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        phone: z.string(),
        email: z.string(),
      })
    )
    .mutation(({ input }) => {
      const courier = couriers.find((courier) => courier.id === input.id);
      if (!courier) {
        throw new Error('Courier not found');
      }

      Object.assign(courier, input);
    }),

  deleteCourier: t.procedure.input(z.number()).mutation(({ input }) => {
    const index = couriers.findIndex((courier) => courier.id === input);
    if (index === -1) {
      throw new Error('Courier not found');
    }

    couriers.splice(index, 1);
  }),
});
