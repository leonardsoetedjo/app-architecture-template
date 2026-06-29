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
      v-model:pagination="pagination"
      @request="onRequest"
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
import { ordersPortInstance } from '../services/orders';
import type { Order } from '../features/orders/types';

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
interface PaginationState {
  page: number;
  rowsPerPage: number;
  sortBy?: string;
  descending?: boolean;
  rowsNumber?: number;
}

const pagination = ref<PaginationState>({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'createdAt',
  descending: false,
  rowsNumber: 0,
});

interface TableRequestProps {
  pagination: {
    page: number;
    rowsPerPage: number;
    sortBy?: string;
    descending?: boolean;
  };
}

async function onRequest(props: TableRequestProps) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  
  const sortField = sortBy ?? 'createdAt';
  const sortOrder = descending ? 'desc' : 'asc' as const;

  const response = await ordersPortInstance.getOrders({
    page: page,
    pageSize: rowsPerPage,
    sortField: sortField,
    sortOrder: sortOrder
  });

  orders.value = response.data;
  pagination.value.rowsNumber = response.totalCount;
}

onMounted(() => {
  onRequest({ pagination: pagination.value });
});
</script>
