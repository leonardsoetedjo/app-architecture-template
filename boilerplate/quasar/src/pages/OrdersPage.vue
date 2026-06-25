<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5">Orders</div>
    </div>

    <q-table
      title="Order History"
      :rows="orders"
      :columns="columns"
      row-key="id"
      :pagination="pagination"
      v-model:pagination="pagination"
      @request="onRequest"
      binary-state-sort-break
    >
      <template v-slot:body-cell-items="props">
        <q-td :props="props">
          {{ props.value.join(', ') }}
        </q-td>
      </template>
      
      <template v-slot:body-cell-total="props">
        <q-td :props="props">
          ${{ props.value.toFixed(2) }}
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ordersPortInstance } from 'src/services/orders';
import type { Order } from 'src/features/orders/types';

const columns = [
  { 
    name: 'id', 
    label: 'Order ID', 
    field: 'id', 
    sortable: true, 
    align: 'left' as const 
  },
  { 
    name: 'status', 
    label: 'Status', 
    field: 'status', 
    sortable: true, 
    align: 'center' as const 
  },
  { 
    name: 'items', 
    label: 'Items', 
    field: 'items', 
    sortable: false, 
    align: 'left' as const 
  },
  { 
    name: 'total', 
    label: 'Total', 
    field: 'total', 
    sortable: true, 
    align: 'center' as const 
  },
  { 
    name: 'createdAt', 
    label: 'Created', 
    field: 'createdAt', 
    sortable: true, 
    align: 'center' as const 
  },
];

const orders = ref<Order[]>([]);
const pagination = ref({
  rows: 0,
  currentPage: 1,
  pageSize: 10,
});

async function onRequest(props: any) {
  const { page, rows, sortBy } = props.pagination;
  
  const sortField = sortBy ? sortBy.toString().toLowerCase() : 'createdAt';
  const sortOrder = sortBy ? (sortBy.toString().includes('desc') ? 'desc' : 'asc') : 'desc';

  // Note: q-table pagination can be complex, let's simplify for the mock service
  const response = await ordersPortInstance.getOrders({
    page: page,
    pageSize: rows,
    sortField: sortField,
    sortOrder: sortOrder as 'asc' | 'desc'
  });

  orders.value = response.data;
  pagination.value.rows = response.totalCount;
}

onMounted(() => {
  onRequest({ pagination: pagination.value });
});
</script>
