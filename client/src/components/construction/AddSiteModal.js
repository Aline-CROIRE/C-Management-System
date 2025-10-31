// client/src/components/construction/AddSiteModal.js
"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import { FaSave, FaTimes, FaExclamationTriangle } from "react-icons/fa"; // FIX: Added FaExclamationTriangle import
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
`;

const DatePickerWrapper = styled.div`
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container input {
    width: 100%;
    padding: 0.8rem 1rem;
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: ${(props) => props.theme.borderRadius.md};
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text};
    transition: border-color 0.2s ease;

    &:focus {
      border-color: ${(props) => props.theme.colors.primary};
      outline: none;
    }
  }
`;

const ErrorMessage = styled.p`
  color: ${(props) => props.theme.colors.danger};
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

const AddSiteModal = ({ siteToEdit, onClose, onSave }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: siteToEdit || {
      name: '',
      location: '',
      startDate: null,
      endDate: null,
      budget: 0,
      status: 'planning',
      description: '',
      progress: 0,
      currentRiskLevel: 'low',
      riskDescription: '',
      safetyIncidents: 0,
      wasteGenerated: 0,
      materialsUsed: 0,
    }
  });

  const [submitting, setSubmitting] = useState(false);
  const startDateWatch = watch("startDate");
  const endDateWatch = watch("endDate");

  useEffect(() => {
    if (siteToEdit) {
      Object.keys(siteToEdit).forEach(key => {
        if (['startDate', 'endDate'].includes(key) && siteToEdit[key]) {
          setValue(key, new Date(siteToEdit[key]));
        } else {
          setValue(key, siteToEdit[key]);
        }
      });
    }
  }, [siteToEdit, setValue]);


  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      budget: parseFloat(data.budget),
      progress: parseInt(data.progress),
      safetyIncidents: parseInt(data.safetyIncidents),
      wasteGenerated: parseFloat(data.wasteGenerated),
      materialsUsed: parseFloat(data.materialsUsed),
      startDate: data.startDate ? data.startDate.toISOString() : null,
      endDate: data.endDate ? data.endDate.toISOString() : null,
    };
    await onSave(payload);
    setSubmitting(false);
  };

  return (
    <Modal title={siteToEdit ? "Edit Construction Site" : "Add New Construction Site"} onClose={onClose}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Site Name"
          placeholder="e.g., Downtown Tower Project"
          {...register("name", { required: "Site name is required" })}
          error={errors.name?.message}
        />
        <Input
          label="Location"
          placeholder="e.g., 123 Main St, City"
          {...register("location", { required: "Location is required" })}
          error={errors.location?.message}
        />
        <FormRow>
          <label>
            <span>Start Date</span>
            <DatePickerWrapper>
              <DatePicker
                selected={startDateWatch}
                onChange={(date) => setValue("startDate", date)}
                selectsStart
                startDate={startDateWatch}
                endDate={endDateWatch}
                placeholderText="Select start date"
                dateFormat="yyyy/MM/dd"
              />
            </DatePickerWrapper>
            {errors.startDate && <ErrorMessage>{errors.startDate.message}</ErrorMessage>}
          </label>
          <label>
            <span>End Date</span>
            <DatePickerWrapper>
              <DatePicker
                selected={endDateWatch}
                onChange={(date) => setValue("endDate", date)}
                selectsEnd
                startDate={startDateWatch}
                endDate={endDateWatch}
                minDate={startDateWatch}
                placeholderText="Select end date"
                dateFormat="yyyy/MM/dd"
              />
            </DatePickerWrapper>
            {errors.endDate && <ErrorMessage>{errors.endDate.message}</ErrorMessage>}
          </label>
        </FormRow>

        <Input
          label="Budget (Rwf)"
          type="number"
          step="0.01"
          placeholder="1000000.00"
          {...register("budget", { required: "Budget is required", min: { value: 0, message: "Budget cannot be negative" } })}
          error={errors.budget?.message}
        />

        <label>
          <span>Status</span>
          <select
            {...register("status", { required: "Status is required" })}
            style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white' }}
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On-Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {errors.status && <ErrorMessage>{errors.status.message}</ErrorMessage>}
        </label>

        <Input
          label="Description"
          placeholder="Brief description of the project"
          {...register("description")}
          as="textarea"
          rows="3"
        />

        <Input
          label="Progress (%)"
          type="number"
          placeholder="0-100"
          {...register("progress", { min: 0, max: 100 })}
          error={errors.progress?.message}
        />

        <label>
          <span>Current Risk Level</span>
          <select
            {...register("currentRiskLevel")}
            style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white' }}
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <Input
          label="Risk Description"
          placeholder="Details about current risks"
          {...register("riskDescription")}
          as="textarea"
          rows="2"
        />

        <Input
          label="Safety Incidents"
          type="number"
          placeholder="0"
          {...register("safetyIncidents", { min: 0 })}
          error={errors.safetyIncidents?.message}
        />

        <Input
          label="Waste Generated (kg)"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("wasteGenerated", { min: 0 })}
          error={errors.wasteGenerated?.message}
        />

        <Input
          label="Materials Used (units)"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("materialsUsed", { min: 0 })}
          error={errors.materialsUsed?.message}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
          <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Site</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddSiteModal;
