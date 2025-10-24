/**
 * Ejemplo práctico de paginación con ordenamiento en SyntroJS
 * Demuestra cómo manejar grandes volúmenes de datos de manera eficiente
 */

import { SyntroJS } from '../../src/index';
import { z } from 'zod';

console.log('📊 Ejemplo: Paginación con Ordenamiento');

const paginationApi = new SyntroJS();

paginationApi
  .title('API de Paginación')
  .version('1.0.0')
  .description('Ejemplo de paginación eficiente con ordenamiento')
  .logging(true)
  
  // Endpoint principal con paginación completa
  .get('/api/products', {
    query: z.object({
      // Paginación básica
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(1000).optional(), // Aumentamos el límite para casos reales
      
      // Ordenamiento
      sortBy: z.enum(['id', 'name', 'price', 'category', 'createdAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      
      // Filtros básicos (opcionales)
      category: z.string().optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional()
    }),
    response: z.object({
      products: z.array(z.object({
        id: z.number(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
        createdAt: z.string(),
        stock: z.number()
      })),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number(),
        sortBy: z.string(),
        sortOrder: z.string(),
        hasNext: z.boolean(),
        hasPrev: z.boolean()
      })
    }),
    handler: ({ query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20; // Default más realista
      const sortBy = query.sortBy ?? 'id';
      const sortOrder = query.sortOrder ?? 'asc';
      
      // Simular una base de datos con 10,000 productos
      const totalProducts = 10000;
      
      // Generar productos simulados
      const allProducts = Array.from({ length: totalProducts }, (_, i) => ({
        id: i + 1,
        name: `Producto ${i + 1}`,
        price: Math.round((Math.random() * 1000 + 10) * 100) / 100, // $10-$1010
        category: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'][i % 5],
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        stock: Math.floor(Math.random() * 100)
      }));
      
      // Aplicar filtros básicos
      let filteredProducts = allProducts;
      
      if (query.category) {
        filteredProducts = filteredProducts.filter(p => 
          p.category.toLowerCase().includes(query.category!.toLowerCase())
        );
      }
      
      if (query.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price >= query.minPrice!);
      }
      
      if (query.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price <= query.maxPrice!);
      }
      
      const total = filteredProducts.length;
      
      // Aplicar ordenamiento
      const sortedProducts = filteredProducts.sort((a, b) => {
        let aValue: string | number = a[sortBy];
        let bValue: string | number = b[sortBy];
        
        // Manejar diferentes tipos de datos
        if (sortBy === 'createdAt') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue as string).toLowerCase();
        }
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
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
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    }
  })
  
  // Endpoint para obtener estadísticas rápidas
  .get('/api/products/stats', {
    response: z.object({
      total: z.number(),
      categories: z.array(z.object({
        name: z.string(),
        count: z.number()
      })),
      priceRange: z.object({
        min: z.number(),
        max: z.number(),
        average: z.number()
      })
    }),
    handler: () => {
      // Simular estadísticas rápidas
      const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
      
      return {
        total: 10000,
        categories: categories.map(cat => ({
          name: cat,
          count: 2000
        })),
        priceRange: {
          min: 10,
          max: 1010,
          average: 510
        }
      };
    }
  });

// Función para demostrar diferentes casos de uso
async function demonstratePagination() {
  console.log('\n🚀 Iniciando servidor de paginación...');
  
  try {
    await paginationApi.listen(3005);
    console.log('✅ Servidor iniciado en puerto 3005');
    
    console.log('\n📚 Documentación disponible en: http://localhost:3005/docs');
    
    console.log('\n💡 Ejemplos de uso:');
    console.log('  📄 Página 1 (default): GET /api/products');
    console.log('  📄 Página 2 con 50 elementos: GET /api/products?page=2&limit=50');
    console.log('  📄 Ordenar por precio descendente: GET /api/products?sortBy=price&sortOrder=desc');
    console.log('  📄 Filtrar por categoría: GET /api/products?category=Electronics');
    console.log('  📄 Rango de precios: GET /api/products?minPrice=100&maxPrice=500');
    console.log('  📄 Combinado: GET /api/products?page=1&limit=100&sortBy=createdAt&sortOrder=desc&category=Electronics');
    
    console.log('\n🎯 Casos de uso reales:');
    console.log('  • 10,000 registros en páginas de 100: ?page=1&limit=100');
    console.log('  • 10,000 registros en páginas de 1,000: ?page=1&limit=1000');
    console.log('  • Ordenar por fecha de creación: ?sortBy=createdAt&sortOrder=desc');
    console.log('  • Filtrar productos electrónicos: ?category=Electronics');
    
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  demonstratePagination().catch(console.error);
}

export { paginationApi };
