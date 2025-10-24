// client/src/components/restaurant/modals/ReusableContainerLogModal.js
"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaSave, FaTimes, FaCalendarAlt, FaBoxes, FaUser, FaDollarSign, FaStickyNote } from 'react-icons/fa';

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

const ReusableContainerLogModal = ({ restaurantId, logToEdit, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: logToEdit || {
      date: new Date().toISOString().split('T')[0],
      containerType: '',
      quantity: 1,
      eventType: '', // 'issued' or 'returned'
      customerName: '',
      depositAmount: 0,
      notes: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      quantity: parseInt(data.quantity),
      date: new Date(data.date).toISOString(),
      depositAmount: parseFloat(data.depositAmount),
    };
    await onSave(payload);
    setSubmitting(false);
  };

  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Log</Button>
    </>
  );

  return (
    <Modal title={logToEdit ? "Edit Container Log" : "Log New Container Event"} onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={<><FaCalendarAlt /> Date of Event</>}
          type="date"
          {...register("date", { required: "Date is required" })}
          error={errors.date?.message}
        />
        <FormRow>
          <Input
            label={<><FaBoxes /> Container Type</>}
            placeholder="e.g., Coffee Cup, Food Container"
            {...register("containerType", { required: "Container type is required" })}
            error={errors.containerType?.message}
          />
          <Input
            label="Quantity"
            type="number"
            placeholder="e.g., 1"
            {...register("quantity", { required: "Quantity is required", min: { value: 1, message: "Quantity must be at least 1" } })}
            error={errors.quantity?.message}
          />
        </FormRow>
        <FormRow>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Event Type</span>
            <select
              {...register("eventType", { required: "Event type is required" })}
              style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="">Select Event</option>
              <option value="issued">Issued (to customer)</option>
              <option value="returned">Returned (by customer)</option>
            </select>
            {errors.eventType && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.eventType.message}</p>}
          </label>
          <Input
            label={<><FaUser /> Customer Name (Optional)</>}
            placeholder="e.g., Jane Doe"
            {...register("customerName")}
          />
        </FormRow>
        <Input
          label={<><FaDollarSign /> Deposit Amount (if applicable)</>}
          type="number"
          step="0.01"
          placeholder="e.g., 5.00"
          {...register("depositAmount", { min: { value: 0, message: "Deposit cannot be negative" } })}
          error={errors.depositAmount?.message}
        />
        <Input
          label={<><FaStickyNote /> Notes (Optional)</>}
          placeholder="Any specific details."
          {...register("notes")}
          as="textarea"
          rows="3"
        />
      </Form>
    </Modal>
  );
};

export default ReusableContainerLogModal;