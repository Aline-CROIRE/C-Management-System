// client/src/components/restaurant/modals/ScheduleModal.js
"use client";

import React, { useState, useMemo } from 'react'; // Added useMemo
import styled from 'styled-components';
import { useForm, Controller } from 'react-hook-form';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { FaSave, FaTimes, FaCalendarAlt, FaClock, FaUserPlus, FaStickyNote } from 'react-icons/fa';
import Select from 'react-select';

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

const ScheduleModal = ({ restaurantId, scheduleToEdit, staffList, onClose, onSave }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: scheduleToEdit ? {
        ...scheduleToEdit,
        date: new Date(scheduleToEdit.date).toISOString().split('T')[0],
        assignedStaff: scheduleToEdit.assignedStaff.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName} (${s.role})` })),
    } : {
      date: new Date().toISOString().split('T')[0],
      shiftStart: '09:00',
      shiftEnd: '17:00',
      assignedStaff: [],
      notes: '',
    }
  });
  const [submitting, setSubmitting] = useState(false);

  const staffOptions = useMemo(() => staffList.map(staff => ({
    value: staff._id,
    label: `${staff.firstName} ${staff.lastName} (${staff.role.replace(/_/g, ' ')})`,
  })), [staffList]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      ...data,
      date: new Date(data.date).toISOString(),
      assignedStaff: data.assignedStaff.map(s => s.value),
    };
    await onSave(payload);
    setSubmitting(false);
  };

  const modalFooterActions = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}><FaTimes /> Cancel</Button>
      <Button variant="primary" type="submit" loading={submitting} disabled={submitting}><FaSave /> Save Schedule</Button>
    </>
  );

  return (
    <Modal title={scheduleToEdit ? "Edit Schedule" : "Add New Schedule"} onClose={onClose} footerActions={modalFooterActions}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={<><FaCalendarAlt /> Date</>}
          type="date"
          {...register("date", { required: "Date is required" })}
          error={errors.date?.message}
        />
        <FormRow>
          <Input
            label={<><FaClock /> Shift Start Time</>}
            type="time"
            {...register("shiftStart", { required: "Shift start time is required" })}
            error={errors.shiftStart?.message}
          />
          <Input
            label="Shift End Time"
            type="time"
            {...register("shiftEnd", { required: "Shift end time is required" })}
            error={errors.shiftEnd?.message}
          />
        </FormRow>
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}><FaUserPlus /> Assigned Staff</span>
            <Controller
              name="assignedStaff"
              control={control}
              rules={{ required: "At least one staff member must be assigned." }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={staffOptions}
                  isMulti
                  placeholder="Select staff members"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '38px',
                      borderColor: errors.assignedStaff ? 'red' : base.borderColor,
                    }),
                  }}
                />
              )}
            />
            {errors.assignedStaff && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.assignedStaff.message}</p>}
          </label>
        </div>
        <Input
          label={<><FaStickyNote /> Notes (Optional)</>}
          placeholder="e.g., Special event, training day"
          {...register("notes")}
          as="textarea"
          rows="3"
        />
      </Form>
    </Modal>
  );
};

export default ScheduleModal;