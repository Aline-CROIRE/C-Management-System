"use client"

import { useState, useRef, useEffect } from "react"
import styled from "styled-components"
import { FaTimes, FaCamera, FaKeyboard, FaSearch } from "react-icons/fa"
import Button from "../common/Button"
import Input from "../common/Input"

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`

const ModalContent = styled.div`
  background: white;
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  width: 100%;
  max-width: 500px;
  box-shadow: ${(props) => props.theme.shadows?.xl || "0 25px 50px -12px rgba(0, 0, 0, 0.25)"};
`

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }
`

const ModalBody = styled.div`
  padding: 2rem;
`

const ScannerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  background: #000;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  overflow: hidden;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const ScannerOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 100px;
  border: 2px solid #00ff00;
  border-radius: 8px;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #00ff00;
  }
  
  &::before {
    top: -3px;
    left: -3px;
    border-right: none;
    border-bottom: none;
  }
  
  &::after {
    bottom: -3px;
    right: -3px;
    border-left: none;
    border-top: none;
  }
`

const PlaceholderText = styled.div`
  color: white;
  text-align: center;
  font-size: 1rem;
`

const TabContainer = styled.div`
  display: flex;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: 0.25rem;
  margin-bottom: 1.5rem;
`

const Tab = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: ${(props) => (props.active ? "white" : "transparent")};
  color: ${(props) => (props.active ? props.theme.colors?.text || "#2d3748" : props.theme.colors?.textSecondary || "#718096")};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: ${(props) => (props.active ? "white" : "rgba(255, 255, 255, 0.5)")};
  }
`

const ManualInput = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const ResultContainer = styled.div`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  padding: 1rem;
  margin-bottom: 1rem;
`

const BarcodeScanner = ({ onClose, onScan }) => {
  const [activeTab, setActiveTab] = useState("camera")
  const [manualBarcode, setManualBarcode] = useState("")
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [activeTab])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setScanning(true)
    } catch (error) {
      console.error("Error accessing camera:", error)
      setActiveTab("manual")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualBarcode.trim()) {
      processBarcode(manualBarcode.trim())
    }
  }

  const processBarcode = (barcode) => {
    // Simulate barcode processing
    setResult({
      barcode,
      found: Math.random() > 0.5, // 50% chance of finding item
      item:
        Math.random() > 0.5
          ? {
              name: "Sample Product",
              sku: "SP-001",
              quantity: 150,
            }
          : null,
    })
  }

  const handleConfirm = () => {
    if (result) {
      onScan(result.barcode, result.item)
    }
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Barcode Scanner</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <TabContainer>
            <Tab active={activeTab === "camera"} onClick={() => setActiveTab("camera")}>
              <FaCamera /> Camera
            </Tab>
            <Tab active={activeTab === "manual"} onClick={() => setActiveTab("manual")}>
              <FaKeyboard /> Manual
            </Tab>
          </TabContainer>

          {activeTab === "camera" && (
            <ScannerContainer>
              {scanning ? (
                <>
                  <VideoElement ref={videoRef} autoPlay playsInline />
                  <ScannerOverlay />
                </>
              ) : (
                <PlaceholderText>
                  <FaCamera size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                  <div>Camera access required</div>
                  <div style={{ fontSize: "0.875rem", marginTop: "0.5rem", opacity: 0.7 }}>
                    Please allow camera permissions to scan barcodes
                  </div>
                </PlaceholderText>
              )}
            </ScannerContainer>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit}>
              <ManualInput>
                <Input
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode manually"
                  autoFocus
                />
                <Button type="submit" variant="primary">
                  <FaSearch />
                </Button>
              </ManualInput>
            </form>
          )}

          {result && (
            <ResultContainer>
              <h4 style={{ margin: "0 0 1rem 0" }}>Scan Result</h4>
              <p>
                <strong>Barcode:</strong> {result.barcode}
              </p>
              {result.found && result.item ? (
                <div>
                  <p>
                    <strong>Item Found:</strong> {result.item.name}
                  </p>
                  <p>
                    <strong>SKU:</strong> {result.item.sku}
                  </p>
                  <p>
                    <strong>Current Stock:</strong> {result.item.quantity}
                  </p>
                </div>
              ) : (
                <p style={{ color: "#ed8936" }}>Item not found in inventory</p>
              )}
            </ResultContainer>
          )}

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {result && (
              <Button variant="primary" onClick={handleConfirm}>
                {result.found ? "View Item" : "Add to Inventory"}
              </Button>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  )
}

export default BarcodeScanner
