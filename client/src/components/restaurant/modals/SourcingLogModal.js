// client/src/components/restaurant/modals/SourcingLogModal.js
"use client";

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useForm, Controller } from 'react-hook-form';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaSave, FaTimes, FaCalendarAlt, FaTruckMoving, FaLeaf, FaCertificate, FaWeight, FaStickyNote } from 'react-icons/fa';
import Select from 'react-select'; // For supplier and multi-cert select

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

const SourcingLogModal = ({ restaurantId, logToEdit, suppliers, onClose, onSave }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: logToEdit ? {
        ...logToEdit,
        date: new Date(logToEdit.date).toISOString().split('T')[0],
        // Format for react-select
        supplier: logToEdit.supplier ? { value: logToEdit.supplier._id, label: logToEdit.supplier.name } : null,
        certifications: logToEdit.certifications ? logToEdit.certifications.map(c => ({ value: c, label: c })) : [],
    } : {
      date: new Date().toISOString().split('T')[0],
      ingredientName: '',
      supplier: null,
      quantity: 0,
      unit: 'kg',
      isLocal: false,
      isCertified: false,
      certifications: [],
      notes: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const supplierOptions = useMemo(() => suppliers.map(s => ({
    value: s._id,
    label: s.name,
  })), [suppliers]);

  const commonCertificationOptions = [ // Example common certs
      { value: 'Organic', label: 'Organic' },
      { value: 'Fair Trade', label: 'Fair Trade' },
      { value: 'Rainforest Alliance', label: 'Rainforest Alliance' },
      { value: 'MSC Certified', label: 'MSC Certified (Seafood)' },
      { value: 'Local Grown', label: 'Local Grown' },
  ];

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      date: new Date(data.date).toISOString(),
      quantity: parseFloat(data.quantity),
      supplier: data.supplier ? data.supplier.value : null, // Extract ID
      certifications: data.certifications ? data.certifications.map(c => c.value) : [], // Extract values
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
    <Modal title={logToEdit ? "Edit Sourcing Log" : "Add New Sourcing Log"} onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={<><FaCalendarAlt /> Date of Sourcing</>}
          type="date"
          {...register("date", { required: "Date is required" })}
          error={errors.date?.message}
        />
        <Input
          label={<><FaLeaf /> Ingredient Name</>}
          placeholder="e.g., Organic Tomatoes, Local Basil"
          {...register("ingredientName", { required: "Ingredient name is required" })}
          error={errors.ingredientName?.message}
        />
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}><FaTruckMoving /> Supplier (Optional)</span>
            <Controller
              name="supplier"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={supplierOptions}
                  isClearable
                  placeholder="Select supplier"
                  styles={{
                    control: (base) => ({
                      ...base, minHeight: '38px',
                    }),
                  }}
                />
              )}
            />
          </label>
        </div>
        <FormRow>
          <Input
            label="Quantity Purchased"
            type="number"
            step="0.01"
            placeholder="e.g., 5"
            {...register("quantity", { required: "Quantity is required", min: { value: 0, message: "Quantity cannot be negative" } })}
            error={errors.quantity?.message}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Unit</span>
            <select
              {...register("unit", { required: "Unit is required" })}
              style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="">Select Unit</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="grams">Grams (g)</option>
              <option value="liters">Liters (L)</option>
              <option value="units">Units</option>
            </select>
            {errors.unit && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.unit.message}</p>}
          </label>
        </FormRow>
        <FormRow>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
              <input type="checkbox" {...register("isLocal")} style={{width: 'auto'}} />
              Sourced Locally?
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
              <input type="checkbox" {...register("isCertified")} style={{width: 'auto'}} />
              Is Certified Sustainable?
            </label>
          </div>
        </FormRow>
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}><FaCertificate /> Certifications (Optional)</span>
            <Controller
              name="certifications"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={commonCertificationOptions}
                  isMulti
                  isClearable
                  placeholder="Select or type certifications"
                  styles={{
                    control: (base) => ({
                      ...base, minHeight: '38px',
                    }),
                  }}
                />
              )}
            />
          </label>
        </div>
        <Input
          label={<><FaStickyNote /> Notes (Optional)</>}
          placeholder="Any specific details about this sourcing."
          {...register("notes")}
          as="textarea"
          rows="3"
        />
      </Form>
    </Modal>
  );
};

export default SourcingLogModal;