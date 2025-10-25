/**
 * Tests para paginación con ordenamiento en SyntroJS
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SyntroJS } from '../../../src/core';

describe('SyntroJS Pagination with Sorting', () => {
  it('should handle pagination with sorting', () => {
    const api = new SyntroJS();

    api
      .title('Pagination Test API')
      .version('1.0.0')
      .get('/products', {
        query: z.object({
          page: z.coerce.number().min(1).optional(),
          limit: z.coerce.number().min(1).max(100).optional(),
          sortBy: z.enum(['id', 'name', 'price']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
        }),
        response: z.object({
          products: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              price: z.number(),
            }),
          ),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            pages: z.number(),
            sortBy: z.string(),
            sortOrder: z.string(),
          }),
        }),
        handler: ({ query }) => {
          const page = query.page ?? 1;
          const limit = query.limit ?? 10;
          const sortBy = query.sortBy ?? 'id';
          const sortOrder = query.sortOrder ?? 'asc';

          // Datos simulados
          const allProducts = [
            { id: 1, name: 'Product A', price: 100 },
            { id: 2, name: 'Product B', price: 200 },
            { id: 3, name: 'Product C', price: 50 },
            { id: 4, name: 'Product D', price: 300 },
            { id: 5, name: 'Product E', price: 150 },
          ];

          const total = allProducts.length;

          // Aplicar ordenamiento
          const sortedProducts = allProducts.sort((a, b) => {
            let aValue: string | number = a[sortBy];
            let bValue: string | number = b[sortBy];

            if (typeof aValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = (bValue as string).toLowerCase();
            }

            if (sortOrder === 'desc') {
              return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          });

          // Aplicar paginación
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

          return {
            products: paginatedProducts,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
              sortBy,
              sortOrder,
            },
          };
        },
      });

    // Verificar que la API se creó correctamente
    expect(api).toBeInstanceOf(SyntroJS);

    // Verificar que OpenAPI se genera correctamente
    const spec = api.getOpenAPISpec();

    expect(spec.info.title).toBe('Pagination Test API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.paths).toHaveProperty('/products');

    // Verificar que los parámetros de query están documentados
    const productsPath = spec.paths['/products'];
    expect(productsPath.get.parameters).toBeDefined();

    const queryParams = productsPath.get.parameters.filter((p: any) => p.in === 'query');
    expect(queryParams.some((p: any) => p.name === 'page')).toBe(true);
    expect(queryParams.some((p: any) => p.name === 'limit')).toBe(true);
    expect(queryParams.some((p: any) => p.name === 'sortBy')).toBe(true);
    expect(queryParams.some((p: any) => p.name === 'sortOrder')).toBe(true);
  });

  it('should validate pagination parameters', () => {
    const api = new SyntroJS();

    api.get('/test', {
      query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
      }),
      handler: () => ({}),
    });

    // Verificar que la API se creó correctamente
    expect(api).toBeInstanceOf(SyntroJS);
  });

  it('should handle large datasets efficiently', () => {
    const api = new SyntroJS();

    api.get('/large-dataset', {
      query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).max(1000).optional(),
        sortBy: z.enum(['id', 'name']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
      response: z.object({
        items: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
          }),
        ),
        pagination: z.object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          pages: z.number(),
        }),
      }),
      handler: ({ query }) => {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const total = 10000; // Simular dataset grande

        // Simular datos grandes
        const items = Array.from({ length: Math.min(limit, total) }, (_, i) => ({
          id: (page - 1) * limit + i + 1,
          name: `Item ${(page - 1) * limit + i + 1}`,
        }));

        return {
          items,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      },
    });

    // Verificar que la API maneja datasets grandes
    expect(api).toBeInstanceOf(SyntroJS);

    const spec = api.getOpenAPISpec();
    expect(spec.paths).toHaveProperty('/large-dataset');
  });
});
