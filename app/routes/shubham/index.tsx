import { Page, usePage } from '@kottster/react';
import { Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { useState } from 'react';
import { trpc } from '../../trpc.client';
import CourierModal from './components/CourierModal';
import CouriersTable from './components/CouriersTable';

export default () => {
  const { navItem } = usePage();
  const [updatingUserId, setUpdatingUserId] = useState<number>();
  const [opened, { open, close }] = useDisclosure(false, {
    onClose: () => setUpdatingUserId(undefined),
  });

  const utils = trpc.useUtils();
  const deleteCourierMutation = trpc.shubham.deleteCourier.useMutation({
    onSuccess: () => {
      utils.shubham.getCouriers.refetch();
    },
  });

  const handleAddClick = () => {
    open();
  };

  const handleEditClick = (id: number) => {
    setUpdatingUserId(id);
    open();
  };

  const handleDeleteClick = (id: number) => {
    modals.openConfirmModal({
      title: 'Delete courier',
      children: (
        <Text size='sm'>Are you sure you want to delete this courier?</Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteCourierMutation.mutate(id);
      },
    });
  };

  return (
    <Page title={navItem.name}>
      <CouriersTable
        onClickAdd={handleAddClick}
        onClickEdit={handleEditClick}
        onClickDelete={handleDeleteClick}
      />

      {opened && <CourierModal onClose={close} courierId={updatingUserId} />}
    </Page>
  );
};
