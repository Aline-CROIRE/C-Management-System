// client/src/components/restaurant/modals/StaffModal.js
"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaSave, FaTimes, FaUserTie, FaEnvelope, FaPhone, FaCalendarAlt, FaBriefcase, FaMoneyBillWave } from 'react-icons/fa';

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

const StaffModal = ({ restaurantId, staffToEdit, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: staffToEdit || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      hireDate: new Date().toISOString().split('T')[0], // Default to today
      salary: 0,
      isActive: true,
      // permissions: [], // Complex, might be managed separately or via role
      // certifications: [], // Managed in another component or sub-modal
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      hireDate: new Date(data.hireDate).toISOString(),
      salary: parseFloat(data.salary),
    };
    await onSave(payload);
    setSubmitting(false);
  };

  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Staff</Button>
    </>
  );

  return (
    <Modal title={staffToEdit ? "Edit Staff Member" : "Add New Staff Member"} onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          <Input
            label={<><FaUserTie /> First Name</>}
            placeholder="e.g., Jane"
            {...register("firstName", { required: "First name is required" })}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            placeholder="e.g., Doe"
            {...register("lastName", { required: "Last name is required" })}
            error={errors.lastName?.message}
          />
        </FormRow>
        <FormRow>
          <Input
            label={<><FaEnvelope /> Email</>}
            type="email"
            placeholder="e.g., jane.doe@example.com"
            {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })}
            error={errors.email?.message}
          />
          <Input
            label={<><FaPhone /> Phone</>}
            type="tel"
            placeholder="e.g., +1 (555) 123-4567"
            {...register("phone", { pattern: { value: /^\+?\d{10,15}$/, message: "Invalid phone number" } })}
            error={errors.phone?.message}
          />
        </FormRow>
        <FormRow>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}><FaBriefcase /> Role</span>
                <select
                {...register("role", { required: "Role is required" })}
                style={{ padding: '0.6rem', borderRadius: '5px', border: '1px solid #ccc' }}
                >
                <option value="">Select Role</option>
                <option value="manager">Manager</option>
                <option value="chef">Chef</option>
                <option value="waitstaff">Waitstaff</option>
                <option value="bartender">Bartender</option>
                <option value="dishwasher">Dishwasher</option>
                <option value="host">Host</option>
                <option value="cleaner">Cleaner</option>
                <option value="admin">Admin</option>
                </select>
                {errors.role && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.role.message}</p>}
            </label>
            <Input
                label={<><FaMoneyBillWave /> Salary (Monthly)</>}
                type="number"
                step="0.01"
                placeholder="e.g., 500000 (Rwf)"
                {...register("salary", { required: "Salary is required", min: { value: 0, message: "Salary cannot be negative" } })}
                error={errors.salary?.message}
            />
        </FormRow>
        <Input
          label={<><FaCalendarAlt /> Hire Date</>}
          type="date"
          {...register("hireDate", { required: "Hire date is required" })}
          error={errors.hireDate?.message}
        />
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
            <input type="checkbox" {...register("isActive")} style={{width: 'auto'}} />
            Active (Uncheck to deactivate staff member)
          </label>
        </div>
      </Form>
    </Modal>
  );
};

export default StaffModal;