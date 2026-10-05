export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type PaginationQuery = {
  page?: string;
  limit?: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parsePagination(query: PaginationQuery) {
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const requestedLimit = Number.parseInt(query.limit ?? "10", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = PAGE_SIZE_OPTIONS.includes(requestedLimit as (typeof PAGE_SIZE_OPTIONS)[number])
    ? requestedLimit
    : 10;

  return { page, pageSize };
}

export function createPagination(total: number, requestedPage: number, pageSize: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return { page, pageSize, total, totalPages };
}

export function paginationQuery(meta: PaginationMeta) {
  return { skip: (meta.page - 1) * meta.pageSize, take: meta.pageSize };
}

export async function paginate<T>(
  query: PaginationQuery,
  count: () => Promise<number>,
  findMany: (args: { skip: number; take: number }) => Promise<T[]>,
) {
  const { page: requestedPage, pageSize } = parsePagination(query);
  const total = await count();
  const pagination = createPagination(total, requestedPage, pageSize);
  const items = await findMany(paginationQuery(pagination));
  return { items, pagination };
}
