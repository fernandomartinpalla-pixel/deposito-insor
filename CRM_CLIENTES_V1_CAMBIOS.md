# CRM Clientes V1 — cambios realizados

## Qué quedó corregido

- Se eliminó la mezcla de versiones que había quedado en `lib/historial-clientes.ts`.
- La búsqueda del cliente ya no depende de `.single()`; carga los clientes visibles y resuelve el ID real localmente.
- Visitas y cobros se relacionan tanto por `cliente_id` como por nombre, evitando perder registros antiguos.
- Entregas continúa relacionándose por nombre hasta agregar `cliente_id` a esa tabla.
- Se evita acceder a `clienteData.id` cuando el cliente no existe.

## Integraciones

- La pantalla Clientes ahora tiene el botón **Abrir ficha CRM**.
- Las tarjetas de Visitas ahora abren la ficha CRM.
- Las tarjetas de Cobros ahora abren la ficha CRM.
- La ficha contiene accesos rápidos para llamar, crear visita, cobro o entrega.

## Diseño y utilidad

- La ficha CRM fue rediseñada para coincidir con el estilo oscuro de Insor Operaciones.
- Resumen de visitas, pedidos, entregas y cobros.
- Pendientes separados en UYU y USD.
- Timeline comercial filtrable.
- Primera recomendación automática de seguimiento según la última visita.

## Prueba recomendada

1. Reemplazar el proyecto por esta carpeta o copiar los archivos modificados.
2. Ejecutar `npm install` si no existe `node_modules`.
3. Ejecutar `npm run dev`.
4. Entrar a **Clientes**.
5. Abrir un cliente usando **Abrir ficha CRM**. No escribir el ID manualmente.

## Próxima mejora estructural recomendada

Agregar `cliente_id` a la tabla `entregas` y guardar ese dato al crear o editar entregas. Así todas las relaciones del CRM quedarán basadas en ID y no en el nombre del cliente.
