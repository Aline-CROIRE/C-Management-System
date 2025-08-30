"use client";
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Html5Qrcode } from 'html5-qrcode';
import { FaTimes } from 'react-icons/fa';
import Button from '../common/Button';

const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1020; display: grid; place-items: center; padding: 1rem; `;
const ModalContent = styled.div` background: white; padding: 1rem; border-radius: 1rem; width: 100%; max-width: 500px; `;
const ScannerWrapper = styled.div`
    width: 100%;
    border: 4px solid #fff;
    border-radius: 0.75rem;
    overflow: hidden;
    #qr-reader {
        width: 100% !important;
    }
`;
const CloseButton = styled(Button)`
    position: absolute;
    top: 2rem;
    right: 2rem;
`;

const BarcodeScannerModal = ({ onClose, onScanSuccess }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const startScanner = async () => {
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText, decodedResult) => {
                        onScanSuccess(decodedText);
                        html5QrCode.stop();
                        onClose();
                    },
                    (errorMessage) => {
                        // handle scan error
                    }
                );
            } catch (err) {
                console.error("Failed to start QR scanner", err);
            }
        };
        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop();
            }
        };
    }, [onClose, onScanSuccess]);

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ScannerWrapper>
                    <div id="qr-reader" />
                </ScannerWrapper>
                <CloseButton variant="danger" onClick={onClose} style={{marginTop: '1rem'}}><FaTimes/> Cancel</CloseButton>
            </ModalContent>
        </ModalOverlay>
    );
};

export default BarcodeScannerModal;