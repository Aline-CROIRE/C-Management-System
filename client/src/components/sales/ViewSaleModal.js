// src/components/sales/ViewSaleModal.js
"use client";
import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes, FaPrint, FaSpinner, FaUndo, FaMoneyBillWave, FaBoxes, FaRedo, FaCheck } from 'react-icons/fa';
import Button from '../common/Button';
import { salesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import ReturnSaleModal from '../inventory/ReturnSaleModal'; // Updated path
import RecordPaymentModal from './RecordPaymentModal'; 
import ReturnPackagingModal from './ReturnPackagingModal'; // NEW Import

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; }`;
const Spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const Spinner = styled(FaSpinner)` animation: ${Spin} 1s linear infinite; `;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1010;
  display: flex; align-items: center; justify-content: center; animation: ${fadeIn} 0.3s;
`;
const ModalContent = styled.div`
  background: white; border-radius: 1rem; width: 90%; max-width: 600px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: ${slideUp} 0.3s;
  max-height: 90vh; display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  h2 { margin: 0; font-size: 1.25rem; }
`;
const ModalBody = styled.div`
  padding: 2rem; flex-grow: 1; overflow-y: auto;
`;
const ModalFooter = styled.div`
  padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0;
  display: flex; justify-content: flex-end; gap: 1rem;
`;
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
`;
const InfoItem = styled.div`
  strong { display: block; color: #718096; font-size: 0.8rem; margin-bottom: 0.25rem; }
  span { font-size: 1rem; }
`;
const ItemsTable = styled.table`width: 100%; border-collapse: collapse; margin-top: 1rem;`;
const Th = styled.th`text-align: left; padding: 0.5rem; background: #f7fafc; border-bottom: 1px solid #e2e8f0;`;
const Td = styled.td`padding: 0.75rem 0.5rem; border-bottom: 1px solid #e2e8f0;`;
const TotalRow = styled.tr`
  td { font-weight: bold; font-size: 1.1rem; }
`;
const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  ${({ status }) => {
    switch (status) {
      case 'Paid': return `background-color: #c6f6d5; color: #2f855a;`;
      case 'Partial': return `background-color: #fefcbf; color: #d69e2e;`;
      case 'Unpaid': return `background-color: #fed7d7; color: #c53030;`;
      default: return `background-color: #e2e8f0; color: #718096;`;
    }
  }}
`;

const ViewSaleModal = ({ sale, onClose, onReturn, onRecordPaymentSuccess }) => {
    const [printLoading, setPrintLoading] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [isRecordingPayment, setIsRecordingPayment] = useState(false);
    const [isReturningPackaging, setIsReturningPackaging] = useState(false); 

    const hasOutstandingReusablePackaging = useMemo(() => 
        sale.items.some(item => 
            item.reusablePackagingItemIdSnapshot && // Check for the new linked ID
            (item.packagingQuantityReturned || 0) < item.quantity
        ), 
    [sale.items]);

    const handlePrint = async () => {
        setPrintLoading(true);
        toast.loading('Generating Receipt...');
        try {
            const response = await salesAPI.generatePDF(sale._id);
            const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt-${sale.receiptNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success('Receipt Downloaded!');
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || 'Failed to generate receipt.');
        } finally {
            setPrintLoading(false);
        }
    };

    const handlePaymentRecorded = () => {
        setIsRecordingPayment(false);
        onRecordPaymentSuccess(); 
    };

    const handlePackagingReturned = () => { 
        setIsReturningPackaging(false);
        onRecordPaymentSuccess(); 
    };

    if (!sale) return null;

    const remainingBalance = sale.totalAmount - sale.amountPaid;

    return (
        <>
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={e => e.stopPropagation()}>
                    <ModalHeader>
                        <h2>Sale Details - #{sale.receiptNumber}</h2>
                        <div>
                            <Button variant="ghost" size="sm" iconOnly onClick={onClose}><FaTimes /></Button>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <InfoGrid>
                            <InfoItem>
                                <strong>CUSTOMER</strong>
                                <span>{sale.customer?.name || 'Walk-in Customer'}</span>
                            </InfoItem>
                            <InfoItem>
                                <strong>DATE OF SALE</strong>
                                <span>{new Date(sale.createdAt).toLocaleString()}</span>
                            </InfoItem>
                            <InfoItem>
                                <strong>PAYMENT METHOD</strong>
                                <span>{sale.paymentMethod || 'N/A'}</span>
                            </InfoItem>
                             <InfoItem>
                                <strong>PAYMENT STATUS</strong>
                                <StatusBadge status={sale.paymentStatus}>{sale.paymentStatus}</StatusBadge>
                            </InfoItem>
                             <InfoItem>
                                <strong>AMOUNT PAID</strong>
                                <span>Rwf {sale.amountPaid?.toLocaleString() || '0'}</span>
                            </InfoItem>
                            {sale.paymentStatus !== 'Paid' && (
                                <InfoItem>
                                    <strong>OUTSTANDING BALANCE</strong>
                                    <span style={{color: '#c53030', fontWeight: 'bold'}}>Rwf {remainingBalance.toLocaleString()}</span>
                                </InfoItem>
                            )}
                            {sale.packagingDepositTotal > 0 && ( 
                                <>
                                    <InfoItem>
                                        <strong>PACKAGING DEPOSIT CHARGED</strong>
                                        <span>Rwf {sale.packagingDepositTotal?.toLocaleString() || '0'}</span>
                                    </InfoItem>
                                    <InfoItem>
                                        <strong>PACKAGING DEPOSIT REFUNDED</strong>
                                        <span>Rwf {sale.packagingReturnedTotal?.toLocaleString() || '0'}</span>
                                    </InfoItem>
                                </>
                            )}
                        </InfoGrid>

                        <h4>Items Sold</h4>
                        <ItemsTable>
                            <thead>
                                <tr>
                                    <Th>Product</Th>
                                    <Th style={{textAlign: 'right'}}>Quantity</Th>
                                    <Th style={{textAlign: 'right'}}>Unit Price</Th>
                                    <Th style={{textAlign: 'right'}}>Packaging Type / Deposit</Th> 
                                    <Th style={{textAlign: 'right'}}>Subtotal</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item, index) => (
                                    <tr key={item.item?._id || index}>
                                        <Td>{item.item?.name || 'N/A'}</Td>
                                        <Td style={{textAlign: 'right'}}>{item.quantity}</Td>
                                        <Td style={{textAlign: 'right'}}>Rwf {item.price.toLocaleString()}</Td>
                                        <Td style={{textAlign: 'right'}}>
                                            {item.reusablePackagingItemIdSnapshot ? // Use new field for conditional display
                                                <span style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem'}}>
                                                    <FaBoxes title={`Reusable Packaging: ${item.reusablePackagingItemIdSnapshot.name || 'N/A'}`} style={{color: '#40916c'}}/> 
                                                    Rwf {item.packagingDepositCharged.toLocaleString()} 
                                                    {item.packagingReturned ? 
                                                        <FaCheck title="Packaging Fully Returned" style={{color: '#38a169'}}/> : 
                                                        <FaRedo title={`Packaging Outstanding: ${item.quantity - (item.packagingQuantityReturned || 0)}`} style={{color: '#ed8936'}}/>
                                                    }
                                                </span>
                                                : (item.packagingTypeSnapshot !== 'None' ? item.packagingTypeSnapshot : 'None')}
                                        </Td>
                                        <Td style={{textAlign: 'right'}}>
                                            Rwf {(item.quantity * item.price + (item.packagingIncluded ? item.quantity * item.packagingDepositCharged : 0)).toLocaleString()}
                                        </Td>
                                    </tr>
                                ))}
                                <TotalRow>
                                    <Td colSpan="4" style={{textAlign: 'right'}}>Total Amount</Td>
                                    <Td style={{textAlign: 'right'}}>Rwf {sale.totalAmount.toLocaleString()}</Td>
                                </TotalRow>
                            </tbody>
                        </ItemsTable>
                    </ModalBody>
                    <ModalFooter>
                        {sale.status === 'Completed' && ( 
                            <Button variant="danger-outline" onClick={() => setIsReturning(true)}><FaUndo/> Process Return</Button>
                        )}
                        {hasOutstandingReusablePackaging && ( 
                            <Button variant="info" onClick={() => setIsReturningPackaging(true)}><FaRedo/> Return Packaging</Button>
                        )}
                        {sale.paymentStatus !== 'Paid' && (
                            <Button variant="primary" onClick={() => setIsRecordingPayment(true)}><FaMoneyBillWave/> Record Payment</Button>
                        )}
                        <Button variant="secondary" onClick={handlePrint} disabled={printLoading}>
                            {printLoading ? <Spinner/> : <FaPrint />} Print
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </ModalOverlay>
            
            {isReturning && (
                <ReturnSaleModal
                    sale={sale}
                    onClose={() => setIsReturning(false)}
                    onConfirm={onReturn}
                />
            )}

            {isRecordingPayment && (
                <RecordPaymentModal
                    sale={sale}
                    onClose={() => setIsRecordingPayment(false)}
                    onPaymentSuccess={handlePaymentRecorded}
                />
            )}

            {isReturningPackaging && ( 
                <ReturnPackagingModal
                    sale={sale}
                    onClose={() => setIsReturningPackaging(false)}
                    onPackagingReturnSuccess={handlePackagingReturned}
                />
            )}
        </>
    );
};

export default ViewSaleModal;