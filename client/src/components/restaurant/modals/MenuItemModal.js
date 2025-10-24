// client/src/components/restaurant/modals/MenuItemModal.js
"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import Modal from '../../common/Modal'; // Updated Modal import
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
    grid-template-columns: repeat(auto-fit, minmax(calc(50% - ${(props) => props.theme.spacing?.md || "0.5rem"}), 1fr));
  }
`;

const MenuItemModal = ({ restaurantId, itemToEdit, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: itemToEdit || {
      name: '',
      description: '',
      category: '',
      price: 0,
      isActive: true,
      imageUrl: '',
      prepTimeMinutes: 10,
      allergens: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      price: parseFloat(data.price),
      prepTimeMinutes: parseInt(data.prepTimeMinutes),
      allergens: data.allergens ? data.allergens.split(',').map(s => s.trim()).filter(s => s) : [],
    };
    await onSave(payload);
    setSubmitting(false);
  };

  // Define footer actions
  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Item</Button>
    </>
  );

  return (
    <Modal
      title={itemToEdit ? "Edit Menu Item" : "Add New Menu Item"}
      onClose={onClose}
      footerActions={modalFooterActions} // Pass actions to the footer prop
    >
      <Form onSubmit={handleSubmit(onSubmit)}> {/* Form is now inside ModalBody via children */}
        <Input
          label="Item Name"
          placeholder="e.g., Margherita Pizza, Caesar Salad"
          {...register("name", { required: "Item name is required" })}
          error={errors.name?.message}
        />
        <Input
          label="Description"
          placeholder="A delicious pizza with fresh basil and mozzarella. (Optional)"
          {...register("description")}
          as="textarea"
          rows="3"
        />
        <FormRow>
            <Input
            label="Category"
            placeholder="e.g., Pizzas, Appetizers, Beverages"
            {...register("category", { required: "Category is required" })}
            error={errors.category?.message}
            />
            <Input
            label="Price (in Rwandan Francs)"
            type="number"
            step="0.01"
            placeholder="e.g., 12.99"
            {...register("price", { required: "Price is required", min: { value: 0, message: "Price cannot be negative" } })}
            error={errors.price?.message}
            />
        </FormRow>
        <FormRow>
            <Input
            label="Preparation Time (in minutes)"
            type="number"
            placeholder="e.g., 15 minutes"
            {...register("prepTimeMinutes", { required: "Prep time is required", min: { value: 0, message: "Prep time cannot be negative" } })}
            error={errors.prepTimeMinutes?.message}
            />
            <Input
            label="Image URL (Optional)"
            type="url"
            placeholder="e.g., https://example.com/pizza.jpg (direct link to image)"
            {...register("imageUrl")}
            error={errors.imageUrl?.message}
            />
        </FormRow>
        <Input
          label="Allergens (comma-separated)"
          placeholder="e.g., gluten, lactose, peanuts (list common allergens)"
          {...register("allergens")}
        />
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
            <input type="checkbox" {...register("isActive")} style={{width: 'auto'}} />
            Active on Menu (If unchecked, item will not appear on public menu)
          </label>
        </div>
      </Form>
    </Modal>
  );
};

export default MenuItemModal;