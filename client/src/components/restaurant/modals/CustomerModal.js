// client/src/components/restaurant/modals/CustomerModal.js
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

const CustomerModal = ({ restaurantId, customerToEdit, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: customerToEdit || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      loyaltyPoints: 0,
      dietaryRestrictions: '',
      notes: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      loyaltyPoints: parseInt(data.loyaltyPoints),
      dietaryRestrictions: data.dietaryRestrictions ? data.dietaryRestrictions.split(',').map(s => s.trim()).filter(s => s) : [],
    };
    await onSave(payload);
    setSubmitting(false);
  };

  // Define footer actions
  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Customer</Button>
    </>
  );

  return (
    <Modal
      title={customerToEdit ? "Edit Customer" : "Add New Customer"}
      onClose={onClose}
      footerActions={modalFooterActions} // Pass actions to the footer prop
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          <Input
            label="First Name"
            placeholder="e.g., Alice"
            {...register("firstName", { required: "First name is required" })}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            placeholder="e.g., Smith"
            {...register("lastName", { required: "Last name is required" })}
            error={errors.lastName?.message}
          />
        </FormRow>
        <FormRow>
          <Input
            label="Email"
            type="email"
            placeholder="e.g., alice.smith@example.com"
            {...register("email", { pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })}
            error={errors.email?.message}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="e.g., +1 (555) 123-4567"
            {...register("phone", { pattern: { value: /^\+?\d{10,15}$/, message: "Invalid phone number" } })}
            error={errors.phone?.message}
          />
        </FormRow>
        <Input
          label="Loyalty Points"
          type="number"
          placeholder="e.g., 150 (current points)"
          {...register("loyaltyPoints", { min: { value: 0, message: "Points cannot be negative" } })}
          error={errors.loyaltyPoints?.message}
        />
        <Input
          label="Dietary Restrictions (comma-separated)"
          placeholder="e.g., Vegetarian, Gluten-Free, Allergy to Peanuts"
          {...register("dietaryRestrictions")}
        />
        <Input
          label="Notes (Optional)"
          placeholder="e.g., Customer prefers quiet tables, always orders sparkling water."
          {...register("notes")}
          as="textarea"
          rows="3"
        />
      </Form>
    </Modal>
  );
};

export default CustomerModal;