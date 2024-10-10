import { Button, LoadingOverlay, Modal, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Plus } from 'react-feather';
import { trpc } from '@/trpc.client';
import { useEffect } from 'react';

interface Props {
  courierId?: number;
  onClose: () => void;
}

interface FormValues {
  name: string;
  phone: string;
  email: string;
}

export default function CourierModal({ courierId, onClose }: Props) {
  const mode = courierId ? 'update' : 'create';

  const utils = trpc.useUtils();
  const { data: courierData, isLoading } = trpc.shubham.getCourier.useQuery(
    courierId as number,
    {
      enabled: mode === 'update',
    }
  );
  const createCourierMutation = trpc.shubham.createCourier.useMutation({
    onSuccess: () => {
      onClose();
      utils.shubham.getCouriers.refetch();
    },
  });
  const updateCourierMutation = trpc.shubham.updateCourier.useMutation({
    onSuccess: () => {
      onClose();
      utils.shubham.getCouriers.refetch();
    },
  });

  const form = useForm<FormValues>({
    validate: {
      name: (value) => value.length < 3 ? 'Name must have at least 2 characters' : null,
      phone: (value) => value.length < 7 ? 'Phone must have at least 6 characters' : null,
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email',
    },
  });

  const handleSubmit = (values: FormValues) => {
    if (mode === 'update') {
      updateCourierMutation.mutate({ id: courierId as number, ...values });
    } else {
      createCourierMutation.mutate(values);
    }

    form.reset();
  };

  useEffect(() => {
    form.setValues({
      name: courierData?.name || '',
      phone: courierData?.phone || '',
      email: courierData?.email || '',
    });
  }, [courierData]);

  return (
    <Modal
      opened
      onClose={onClose}
      title={mode === 'update' ? 'Edit courier' : 'Add courier'}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          required
          label='Full Name'
          placeholder='John Doe'
          mb='md'
          {...form.getInputProps('name')}
        />

        <TextInput
          required
          label='Phone number'
          placeholder='(555) 123-4567'
          mb='md'
          {...form.getInputProps('phone')}
        />

        <TextInput
          required
          label='Email'
          placeholder='john@example.com'
          {...form.getInputProps('email')}
        />

        <Button
          type='submit'
          mt='xl'
          leftSection={mode === 'create' && <Plus size={16} />}>
          {mode === 'update' ? 'Save changes' : 'Add'}
        </Button>
      </form>

      <LoadingOverlay visible={mode === 'update' && isLoading} />
    </Modal>
  );
}
