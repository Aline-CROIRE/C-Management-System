// client/src/components/restaurant/modals/ResourceLogModal.js
"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaSave, FaTimes, FaCalendarAlt, FaBolt, FaWater, FaRecycle, FaWeight, FaStickyNote } from 'react-icons/fa';

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

const ResourceLogModal = ({ restaurantId, logToEdit, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: logToEdit || {
      date: new Date().toISOString().split('T')[0],
      type: '',
      quantity: 0,
      unit: '',
      source: '',
      notes: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      quantity: parseFloat(data.quantity),
      date: new Date(data.date).toISOString(),
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
    <Modal title={logToEdit ? "Edit Resource Log" : "Add New Resource Log"} onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={<><FaCalendarAlt /> Date of Log</>}
          type="date"
          {...register("date", { required: "Date is required" })}
          error={errors.date?.message}
        />
        <FormRow>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Resource Type</span>
            <select
              {...register("type", { required: "Resource type is required" })}
              style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="">Select Type</option>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="gas">Gas</option>
              <option value="other">Other</option>
            </select>
            {errors.type && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.type.message}</p>}
          </label>
          <Input
            label="Quantity Consumed"
            type="number"
            step="0.01"
            placeholder="e.g., 100.5"
            {...register("quantity", { required: "Quantity is required", min: { value: 0, message: "Quantity cannot be negative" } })}
            error={errors.quantity?.message}
          />
        </FormRow>
        <FormRow>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Unit of Measure</span>
                <select
                {...register("unit", { required: "Unit is required" })}
                style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
                >
                <option value="">Select Unit</option>
                <option value="kWh">Kilowatt-hour (kWh)</option>
                <option value="m³">Cubic Meters (m³)</option>
                <option value="liters">Liters (L)</option>
                <option value="gallons">Gallons</option>
                </select>
                {errors.unit && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.unit.message}</p>}
            </label>
            <Input
            label="Source/Meter (Optional)"
            placeholder="e.g., Main Meter, Kitchen Tap"
            {...register("source")}
            />
        </FormRow>
        <Input
          label={<><FaStickyNote /> Notes (Optional)</>}
          placeholder="Any specific observations or anomalies."
          {...register("notes")}
          as="textarea"
          rows="3"
        />
      </Form>
    </Modal>
  );
};

export default ResourceLogModal;