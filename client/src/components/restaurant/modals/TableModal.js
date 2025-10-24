// client/src/components/restaurant/modals/TableModal.js
"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaSave, FaTimes } from 'react-icons/fa';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  align-items: flex-start;
  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
`;

const TableModal = ({ restaurantId, tableToEdit, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: tableToEdit || {
      tableNumber: '',
      capacity: 2,
      status: 'vacant',
      location: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
        ...data,
        capacity: parseInt(data.capacity),
    };
    await onSave(payload);
    setSubmitting(false);
  };

  // Define footer actions
  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Table</Button>
    </>
  );

  return (
    <Modal
      title={tableToEdit ? "Edit Table" : "Add New Table"}
      onClose={onClose}
      footerActions={modalFooterActions} // Pass actions to the footer prop
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Table Number/Name"
          placeholder="e.g., Table 5, Bar Seat A1"
          {...register("tableNumber", { required: "Table number is required" })}
          error={errors.tableNumber?.message}
        />
        <FormRow>
          <Input
            label="Capacity (Number of Seats)"
            type="number"
            placeholder="e.g., 4 people"
            {...register("capacity", { required: "Capacity is required", min: { value: 1, message: "Capacity must be at least 1" } })}
            error={errors.capacity?.message}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Status</span>
            <select
              {...register("status", { required: "Status is required" })}
              style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="vacant">Vacant (Ready for Guests)</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="cleaning">Cleaning</option>
              <option value="ordering">Ordering (Guests currently ordering via QR)</option>
            </select>
            {errors.status && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.status.message}</p>}
          </label>
        </FormRow>
        <Input
          label="Location (Optional)"
          placeholder="e.g., Main Dining Area, Outdoor Patio, Bar Section"
          {...register("location")}
          error={errors.location?.message}
        />
      </Form>
    </Modal>
  );
};

export default TableModal;