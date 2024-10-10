import React, { useState } from 'react';
import { Button, Grid, Group, Input, LoadingOverlay, Pagination, Paper, Space, Table } from '@mantine/core';
import { trpc } from '@/trpc.client';
import { Edit, Plus, Search, Trash } from 'react-feather';
import { useDebouncedValue } from '@mantine/hooks';

interface Props {
  onClickAdd: () => void;
  onClickEdit: (id: number) => void;
  onClickDelete: (id: number) => void;
}

interface QueryParams {
  search: string;
  page: number;
  pageSize: number;
}

export default function CouriersTable({
  onClickAdd,
  onClickEdit,
  onClickDelete,
}: Props) {
  const [queryParams, setQueryParams] = useState<QueryParams>({
    search: '',
    page: 1,
    pageSize: 10,
  });
  const [debouncedSearch] = useDebouncedValue(queryParams.search, 200);

  const { data, isLoading } = trpc.shubham.getCouriers.useQuery({
    search: debouncedSearch,
    page: queryParams.page,
    pageSize: queryParams.pageSize,
  });

  const rows = data?.couriers.map((courier) => (
    <Table.Tr key={courier.id}>
      <Table.Td>{courier.id}</Table.Td>
      <Table.Td>{courier.name}</Table.Td>
      <Table.Td>{courier.phone}</Table.Td>
      <Table.Td>{courier.email}</Table.Td>
      <Table.Td p='xs'>
        <Group justify='end' gap='xs'>
          <Button
            variant='light'
            size='compact-xs'
            fz='sm'
            leftSection={<Edit size={14} />}
            onClick={() => onClickEdit(courier.id)}>
            Edit
          </Button>
          <Button
            variant='light'
            size='compact-xs'
            fz='sm'
            color='gray'
            onClick={() => onClickDelete(courier.id)}
          >
            <Trash size={14} />
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryParams((prev) => ({
      ...prev,
      search: e.currentTarget.value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  return (
    <>
      <Grid justify='space-between'>
        <Grid.Col span={3}>
          <Input
            placeholder='Search by full name'
            leftSection={<Search size={16} />}
            value={queryParams.search}
            onChange={handleSearchChange}
          />
        </Grid.Col>
        <Grid.Col span='content'>
          <Button leftSection={<Plus size={16} />} onClick={onClickAdd}>
            Add courier
          </Button>
        </Grid.Col>
      </Grid>
      <Space h='lg' />
      <Paper withBorder p='md'>
        <Table.ScrollContainer minWidth={500} pos='relative'>
          <Table verticalSpacing='xs' highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th fw='bold'>ID</Table.Th>
                <Table.Th fw='bold'>Full name</Table.Th>
                <Table.Th fw='bold'>Phone number</Table.Th>
                <Table.Th fw='bold'>Email</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>

          <LoadingOverlay visible={isLoading} />
        </Table.ScrollContainer>
        <Space h='xs' />
        <Pagination
          total={Math.ceil((data?.totalCount || 0) / queryParams.pageSize)}
          value={queryParams.page}
          onChange={handlePageChange}
        />
      </Paper>
    </>
  );
}
