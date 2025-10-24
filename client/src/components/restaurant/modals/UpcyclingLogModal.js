// client/src/components/restaurant/modals/UpcyclingLogModal.js
"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaSave, FaTimes, FaCalendarAlt, FaHandSparkles, FaUser, FaTag, FaStickyNote } from 'react-icons/fa';

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

const UpcyclingLogModal = ({ restaurantId, logToEdit, onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: logToEdit || {
      date: new Date().toISOString().split('T')[0],
      projectName: '',
      itemUsed: '',
      description: '',
      responsibleStaff: '',
      tags: '', // Comma-separated string for input
      notes: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      date: new Date(data.date).toISOString(),
      tags: data.tags ? data.tags.split(',').map(s => s.trim()).filter(s => s) : [],
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
    <Modal title={logToEdit ? "Edit Upcycling Log" : "Log New Upcycling Activity"} onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={<><FaCalendarAlt /> Date of Activity</>}
          type="date"
          {...register("date", { required: "Date is required" })}
          error={errors.date?.message}
        />
        <Input
          label={<><FaHandSparkles /> Project/Activity Name</>}
          placeholder="e.g., Jar Herb Garden, Pallet Furniture"
          {...register("projectName", { required: "Project name is required" })}
          error={errors.projectName?.message}
        />
        <Input
          label="Item(s) Used"
          placeholder="e.g., Glass jars, wooden pallets, coffee grounds"
          {...register("itemUsed", { required: "Item(s) used is required" })}
          error={errors.itemUsed?.message}
        />
        <Input
          label="Description (Optional)"
          placeholder="Detailed description of what was upcycled/reused into what."
          {...register("description")}
          as="textarea"
          rows="3"
        />
        <FormRow>
          <Input
            label={<><FaUser /> Responsible Staff (Optional)</>}
            placeholder="e.g., Chef John, Manager Alice"
            {...register("responsibleStaff")}
          />
          <Input
            label={<><FaTag /> Tags (comma-separated)</>}
            placeholder="e.g., decor, kitchen, gardening"
            {...register("tags")}
          />
        </FormRow>
        <Input
          label={<><FaStickyNote /> Notes (Optional)</>}
          placeholder="Any additional notes or future ideas."
          {...register("notes")}
          as="textarea"
          rows="3"
        />
      </Form>
    </Modal>
  );
};

export default UpcyclingLogModal;