// client/src/components/restaurant/RestaurantSettings.js
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components'; // Import css
import { FaSave, FaTimes, FaSync, FaStore, FaMapMarkerAlt, FaPhone, FaEnvelope, FaInfoCircle, FaQrcode, FaDownload } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { restaurantAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import AlertCard from '../common/AlertCard';
import toast from 'react-hot-toast';

const spinAnimation = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
`;

const SettingsSection = styled(Card)`
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  h4 {
    margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
    font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
    color: ${(props) => props.theme.colors?.text};
    display: flex;
    align-items: center;
    gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  }
`;

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const SpinningFaSync = styled(FaSync)`
  animation: ${css`${spinAnimation}`} 1s linear infinite; /* Fix applied here */
`;


const RestaurantSettings = ({ restaurantId, currentRestaurantData, onUpdate }) => {
  // useMemo for defaultValues is at the top level and unconditional
  const defaultFormValues = useMemo(() => {
    return currentRestaurantData ? {
      name: currentRestaurantData.name || '',
      email: currentRestaurantData.email || '',
      phone: currentRestaurantData.phone || '',
      address: {
        street: currentRestaurantData.address?.street || '',
        city: currentRestaurantData.address?.city || '',
        state: currentRestaurantData.address?.state || '',
        zip: currentRestaurantData.address?.zip || '',
        country: currentRestaurantData.address?.country || '',
      },
      description: currentRestaurantData.description || '',
      circularEconomyGoals: {
        wasteReductionTarget: currentRestaurantData.circularEconomyGoals?.wasteReductionTarget || 0,
        energyReductionTarget: currentRestaurantData.circularEconomyGoals?.energyReductionTarget || 0,
        waterReductionTarget: currentRestaurantData.circularEconomyGoals?.waterReductionTarget || 0,
      }
    } : {};
  }, [currentRestaurantData]);


  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: defaultFormValues
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrGeneratedForTable, setQrGeneratedForTable] = useState(null);

  useEffect(() => {
    if (currentRestaurantData) {
      reset(defaultFormValues);
    }
  }, [currentRestaurantData, reset, defaultFormValues]);


  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        circularEconomyGoals: {
          wasteReductionTarget: parseInt(data.circularEconomyGoals.wasteReductionTarget),
          energyReductionTarget: parseInt(data.circularEconomyGoals.energyReductionTarget),
          waterReductionTarget: parseInt(data.circularEconomyGoals.waterReductionTarget),
          lastUpdated: new Date(),
        }
      };
      const response = await restaurantAPI.updateRestaurant(restaurantId, payload);
      if (response?.success) {
        toast.success('Restaurant settings updated successfully!');
        onUpdate();
      } else {
        toast.error(response?.message || 'Failed to update settings.');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred updating settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAndDownloadQr = async () => {
    setLoadingQr(true);
    setQrDataUrl(null);
    setQrGeneratedForTable(null);
    try {
      const tablesResponse = await restaurantAPI.getTables(restaurantId);
      let targetTable = null; // Changed to store the whole table object
      if(tablesResponse?.success && tablesResponse.data.length > 0) {
        targetTable = tablesResponse.data[0]; // Use the first available table
        setQrGeneratedForTable(targetTable); // Store the table info
      } else {
        toast.error('No tables found. Please create at least one table to generate a QR code link.');
        setLoadingQr(false);
        return;
      }

      const response = await restaurantAPI.generateQrCodeLink(restaurantId, targetTable._id); // Use targetTable._id
      if (response?.success) {
        setQrDataUrl(response.qrCodeDataUrl);
        const link = document.createElement('a');
        link.href = response.qrCodeDataUrl;
        link.download = `${currentRestaurantData.name.replace(/\s/g, '-')}-Order-QR-Code-Table-${targetTable.tableNumber || 'default'}.png`; // Use targetTable.tableNumber
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code generated and downloaded!');
      } else {
        toast.error(response?.message || 'Failed to generate QR Code.');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred generating QR Code.');
    } finally {
      setLoadingQr(false);
    }
  };


  return (
    <SettingsContainer>
      <HeaderBar>
        <h3>Restaurant Profile Settings</h3>
        <Button variant="outline" onClick={onUpdate} disabled={submitting}><SpinningFaSync /> Refresh Data</Button>
      </HeaderBar>
      <SettingsForm onSubmit={handleSubmit(onSubmit)}>
        <SettingsSection>
          <h4><FaStore /> General Information</h4>
          <Input
            label="Restaurant Name"
            placeholder="e.g., The Green Bistro"
            {...register("name", { required: "Restaurant name is required" })}
            error={errors.name?.message}
          />
          <Input
            label="Short Description"
            placeholder="A farm-to-table restaurant focusing on sustainable, local ingredients."
            {...register("description")}
            as="textarea"
            rows="3"
          />
          <Input
            label="Logo URL (Optional)"
            type="url"
            placeholder="https://example.com/logo.png"
            {...register("logoUrl")}
            error={errors.logoUrl?.message}
          />
        </SettingsSection>

        <SettingsSection>
          <h4><FaMapMarkerAlt /> Contact & Address</h4>
          <FormRow>
            <Input
              label="Contact Email"
              type="email"
              placeholder="info@greenbistro.com"
              {...register("email", { required: "Contact email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })}
              error={errors.email?.message}
            />
            <Input
              label="Contact Phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register("phone", { required: "Contact phone number is required", pattern: { value: /^\+?\d{10,15}$/, message: "Invalid phone number" } })}
              error={errors.phone?.message}
            />
          </FormRow>
          <FormRow>
            <Input
              label="Street Address"
              placeholder="123 Evergreen Lane"
              {...register("address.street", { required: "Street address is required" })}
              error={errors.address?.street?.message}
            />
            <Input
              label="City"
              placeholder="Greenfield"
              {...register("address.city", { required: "City is required" })}
              error={errors.address?.city?.message}
            />
          </FormRow>
          <FormRow>
            <Input
              label="State/Province (Optional)"
              placeholder="GA"
              {...register("address.state")}
              error={errors.address?.state?.message}
            />
            <Input
              label="Zip/Postal Code"
              placeholder="30303"
              {...register("address.zip", { required: "Zip/Postal code is required" })}
              error={errors.zip?.message}
            />
          </FormRow>
          <Input
            label="Country"
            placeholder="United States"
            {...register("address.country", { required: "Country is required" })}
            error={errors.address?.country?.message}
          />
        </SettingsSection>

        <SettingsSection>
          <h4><FaInfoCircle /> Circular Economy Goals</h4>
          <FormRow>
            <Input
              label="Waste Reduction Target (%)"
              type="number"
              placeholder="20"
              {...register("circularEconomyGoals.wasteReductionTarget", { min: 0, max: 100 })}
              error={errors.circularEconomyGoals?.wasteReductionTarget?.message}
            />
            <Input
              label="Energy Reduction Target (%)"
              type="number"
              placeholder="15"
              {...register("circularEconomyGoals.energyReductionTarget", { min: 0, max: 100 })}
              error={errors.circularEconomyGoals?.energyReductionTarget?.message}
            />
            <Input
              label="Water Reduction Target (%)"
              type="number"
              placeholder="10"
              {...register("circularEconomyGoals.waterReductionTarget", { min: 0, max: 100 })}
              error={errors.circularEconomyGoals?.waterReductionTarget?.message}
            />
          </FormRow>
        </SettingsSection>

        <Button type="submit" loading={submitting} disabled={submitting} fullWidth size="lg">
          <FaSave /> Save All Settings
        </Button>
      </SettingsForm>

      <SettingsSection>
        <h4><FaQrcode /> Generate QR Code for Orders</h4>
        <p>Generate a QR code that customers can scan to view your menu and place orders from a table.</p>
        <Button variant="info" onClick={handleGenerateAndDownloadQr} disabled={loadingQr} style={{marginTop: '1rem'}}>
          {loadingQr ? <SpinningFaSync /> : <FaQrcode />} Generate & Download Main Order QR
        </Button>
        {qrDataUrl && qrGeneratedForTable && (
          <div style={{marginTop: '1rem', textAlign: 'center'}}>
            <p>QR Code for Table {qrGeneratedForTable.tableNumber}:</p>
            <img src={qrDataUrl} alt={`QR Code for Table ${qrGeneratedForTable.tableNumber}`} style={{maxWidth: '200px', border: '1px solid #eee', borderRadius: '8px'}} />
          </div>
        )}
      </SettingsSection>
    </SettingsContainer>
  );
};

export default RestaurantSettings;