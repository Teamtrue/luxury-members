import { dbQuery } from '@/lib/db/client';

export async function listDeals() {
  return dbQuery<{
    id: string;
    title: string;
    description: string | null;
    price_inr: number;
    is_active: boolean;
    created_at: string;
  }>(`select id, title, description, price_inr, is_active, created_at from deals order by created_at desc limit 300`);
}

export async function createDeal(input: {
  id: string;
  title: string;
  description: string;
  priceInr: number;
  isActive: boolean;
}) {
  await dbQuery(
    `insert into deals (id, title, description, price_inr, is_active)
     values ($1, $2, $3, $4, $5)`,
    [input.id, input.title, input.description, input.priceInr, input.isActive]
  );
}

export async function updateDeal(input: {
  dealId: string;
  title?: string;
  description?: string;
  priceInr?: number;
  isActive?: boolean;
}) {
  await dbQuery(
    `update deals
     set title = coalesce($2, title),
         description = coalesce($3, description),
         price_inr = coalesce($4, price_inr),
         is_active = coalesce($5, is_active)
     where id = $1`,
    [input.dealId, input.title ?? null, input.description ?? null, input.priceInr ?? null, input.isActive ?? null]
  );
}

export async function deleteDeal(dealId: string) {
  await dbQuery('delete from deals where id = $1', [dealId]);
}
