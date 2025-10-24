// client/src/components/restaurant/modals/WasteLogModal.js
"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import Modal from '../../common/Modal'; // Correct path to your common Modal component
import Input from '../../common/Input';
import Button from '../../common/Button';
// All necessary icons imported
import { FaSave, FaTimes, FaCalendarAlt, FaWeight, FaRecycle, FaTag, FaStickyNote } from 'react-icons/fa';

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

const WasteLogModal = ({ restaurantId, logToEdit, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: logToEdit || {
      date: new Date().toISOString().split('T')[0], // Default to today's date (YYYY-MM-DD)
      type: '',
      quantity: 0,
      unit: 'kg', // Default unit
      disposalMethod: '',
      source: '', // e.g., "Kitchen Prep", "Customer Plate"
      notes: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      quantity: parseFloat(data.quantity), // Ensure quantity is parsed as a float
      date: new Date(data.date).toISOString(), // Convert date back to ISO string for backend
    };
    await onSave(payload);
    setSubmitting(false);
  };

  // Define footer actions to be passed to the Modal component
  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Log</Button>
    </>
  );

  return (
    <Modal title={logToEdit ? "Edit Waste Log" : "Add New Waste Log"} onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={<><FaCalendarAlt /> Date of Log</>}
          type="date"
          {...register("date", { required: "Date is required" })}
          error={errors.date?.message}
        />
        <FormRow>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Waste Type</span>
            <select
              {...register("type", { required: "Waste type is required" })}
              style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="">Select Waste Type...</option>
              <option value="food_pre_consumer">Food (Pre-consumer: e.g., prep scraps)</option>
              <option value="food_post_consumer">Food (Post-consumer: e.g., plate waste)</option>
              <option value="packaging_plastic">Packaging (Plastic)</option>
              <option value="packaging_paper">Packaging (Paper/Cardboard)</option>
              <option value="packaging_glass">Packaging (Glass)</option>
              <option value="cooking_oil">Used Cooking Oil</option>
              <option value="general_waste">General Waste (Landfill)</option>
              <option value="other">Other (Specify in notes)</option>
            </select>
            {errors.type && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.type.message}</p>}
          </label>
          <Input
            label={<><FaWeight /> Quantity</>}
            type="number"
            step="0.01"
            placeholder="e.g., 2.5 (numerical value)"
            {...register("quantity", { required: "Quantity is required", min: { value: 0, message: "Quantity cannot be negative" } })}
            error={errors.quantity?.message}
          />
        </FormRow>
        <FormRow>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}><FaTag /> Unit</span>
                <select
                {...register("unit", { required: "Unit is required" })}
                style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
                >
                <option value="">Select Unit...</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="liters">Liters (L)</option>
                <option value="units">Units (e.g., number of items)</option>
                {/* REMOVED: Extra </option> tag here */}
                </select>
                {errors.unit && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.unit.message}</p>}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}><FaRecycle /> Disposal Method</span>
                <select
                {...register("disposalMethod", { required: "Disposal method is required" })}
                style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
                >
                <option value="">Select Method...</option>
                <option value="compost">Compost</option>
                <option value="recycle">Recycle</option>
                <option value="landfill">Landfill (General Trash)</option>
                <option value="donation">Donation (e.g., surplus food)</option>
                <option value="animal_feed">Animal Feed</option>
                <option value="reused">Reused Internally</option>
                {/* REMOVED: Extra </option> tag here */}
                </select>
                {errors.disposalMethod && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.disposalMethod.message}</p>}
            </label>
        </FormRow>
        <Input
          label="Source (Optional)"
          placeholder="e.g., Kitchen Prep Area, Dining Room, Bar"
          {...register("source")}
        />
        <Input
          label={<><FaStickyNote /> Notes (Optional)</>}
          placeholder="Any specific observations, quality issues, or details."
          {...register("notes")}
          as="textarea"
          rows="3"
        />
      </Form>
    </Modal>
  );
};

export default WasteLogModal;