"use client"

import { useState, useEffect, useCallback } from "react"
import styled from "styled-components"
import {
  FaUsers,
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaStar,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBuilding,
  FaChartLine,
  FaDollarSign,
  FaExclamationTriangle,
} from "react-icons/fa"
import Button from "../common/Button"
import Input from "../common/Input"
import LoadingSpinner from "../common/LoadingSpinner"
import Card from "../common/Card"
import { suppliersAPI } from "../../services/api"
import { useNotifications } from "../../contexts/NotificationContext"

const Container = styled.div`
  padding: 2rem;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const StatCard = styled(Card)`
  padding: 1.5rem;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(0, 0, 0, 0.1)"};
  }
`

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) => props.iconColor || props.theme.colors?.primary || "#1b4332"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: 0.25rem;
`

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: none;
  }
`

const SearchInput = styled(Input)`
  padding-left: 3rem;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-size: 18px;
  z-index: 2;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
    
    button {
      flex: 1;
    }
  }
`

const SuppliersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`

const SupplierCard = styled(Card)`
  padding: 1.5rem;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(0, 0, 0, 0.1)"};
    border-color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }
`

const SupplierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`

const SupplierInfo = styled.div`
  flex: 1;
`

const SupplierName = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const SupplierCategory = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  margin-bottom: 0.5rem;
`

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const StarRating = styled.div`
  display: flex;
  gap: 0.125rem;
`

const Star = styled(FaStar)`
  color: ${(props) => (props.filled ? "#fbbf24" : "#e5e7eb")};
  font-size: 0.875rem;
`

const RatingValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
`

const ContactInfo = styled.div`
  margin-bottom: 1rem;
`

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};

  &:last-child {
    margin-bottom: 0;
  }
`

const SupplierStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
`

const StatItem = styled.div`
  text-align: center;
`

const StatNumber = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: 0.25rem;
`

const StatText = styled.div`
  font-size: 0.75rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    switch (props.status) {
      case "active":
        return `
          background: ${props.theme.colors?.success || "#2d5016"}20;
          color: ${props.theme.colors?.success || "#2d5016"};
        `
      case "inactive":
        return `
          background: ${props.theme.colors?.error || "#c53030"}20;
          color: ${props.theme.colors?.error || "#c53030"};
        `
      case "pending":
        return `
          background: ${props.theme.colors?.warning || "#ed8936"}20;
          color: ${props.theme.colors?.warning || "#ed8936"};
        `
      default:
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
    }
  }}
`

const SupplierActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  border: none;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => {
      switch (props.variant) {
        case "danger":
          return props.theme.colors?.error || "#c53030"
        default:
          return props.theme.colors?.primary || "#1b4332"
      }
    }};
    color: white;
    transform: translateY(-1px);
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: ${(props) => props.theme.colors?.text || "#2d3748"};
  }

  p {
    margin-bottom: 1.5rem;
  }
`

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    rating: "",
  })

  const { addNotification } = useNotifications()

  // Sample supplier data for demonstration
  const sampleSuppliers = [
    {
      id: 1,
      name: "Steel Dynamics Corp",
      contactPerson: "John Smith",
      email: "john@steeldynamics.com",
      phone: "+1 (555) 123-4567",
      address: "123 Industrial Ave, Steel City, SC 12345",
      category: "Construction Materials",
      rating: 4.8,
      totalOrders: 45,
      totalValue: 875000,
      status: "active",
      lastOrder: "2024-01-15",
      performance: {
        onTimeDelivery: 95,
        qualityRating: 4.7,
        responseTime: 2.3,
      },
    },
    {
      id: 2,
      name: "Green Valley Farms",
      contactPerson: "Sarah Johnson",
      email: "sarah@greenvalley.com",
      phone: "+1 (555) 234-5678",
      address: "456 Farm Road, Green Valley, GV 23456",
      category: "Fresh Produce",
      rating: 4.6,
      totalOrders: 32,
      totalValue: 125000,
      status: "active",
      lastOrder: "2024-01-14",
      performance: {
        onTimeDelivery: 88,
        qualityRating: 4.8,
        responseTime: 1.5,
      },
    },
    {
      id: 3,
      name: "Tech Solutions Inc",
      contactPerson: "Mike Wilson",
      email: "mike@techsolutions.com",
      phone: "+1 (555) 345-6789",
      address: "789 Tech Street, Silicon Valley, SV 34567",
      category: "Electronics",
      rating: 4.9,
      totalOrders: 28,
      totalValue: 450000,
      status: "active",
      lastOrder: "2024-01-10",
      performance: {
        onTimeDelivery: 98,
        qualityRating: 4.9,
        responseTime: 0.8,
      },
    },
    {
      id: 4,
      name: "Office Supplies Plus",
      contactPerson: "Lisa Brown",
      email: "lisa@officesupplies.com",
      phone: "+1 (555) 456-7890",
      address: "321 Office Blvd, Business Park, BP 45678",
      category: "Office Supplies",
      rating: 4.2,
      totalOrders: 15,
      totalValue: 95000,
      status: "pending",
      lastOrder: "2024-01-08",
      performance: {
        onTimeDelivery: 82,
        qualityRating: 4.1,
        responseTime: 3.2,
      },
    },
  ]

  // Fetch suppliers
  const fetchSuppliers = useCallback(
    async (params = {}) => {
      try {
        setLoading(true)
        setError(null)

        // For demo purposes, use sample data
        // In production, uncomment the API call below
        // const response = await suppliersAPI.getAll(params)
        // setSuppliers(response.data || response.suppliers || [])

        setSuppliers(sampleSuppliers)

        // Calculate stats
        const totalSuppliers = sampleSuppliers.length
        const activeSuppliers = sampleSuppliers.filter((s) => s.status === "active").length
        const totalValue = sampleSuppliers.reduce((sum, supplier) => sum + supplier.totalValue, 0)
        const avgRating = sampleSuppliers.reduce((sum, supplier) => sum + supplier.rating, 0) / sampleSuppliers.length

        setStats({
          totalSuppliers,
          activeSuppliers,
          totalValue,
          avgRating: avgRating.toFixed(1),
        })
      } catch (err) {
        setError(err.message)
        addNotification({
          type: "error",
          title: "Error Loading Suppliers",
          message: err.message,
        })
      } finally {
        setLoading(false)
      }
    },
    [addNotification],
  )

  // Handle search
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      !searchQuery ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !filters.status || supplier.status === filters.status
    const matchesCategory = !filters.category || supplier.category === filters.category

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => <Star key={i} filled={i < Math.floor(rating)} />)
  }

  // Handle supplier actions
  const handleViewSupplier = (supplier) => {
    // Open supplier details modal
    console.log("View supplier:", supplier)
  }

  const handleEditSupplier = (supplier) => {
    // Open edit supplier modal
    console.log("Edit supplier:", supplier)
  }

  const handleDeleteSupplier = async (supplierId) => {
    try {
      await suppliersAPI.delete(supplierId)
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId))

      addNotification({
        type: "success",
        title: "Supplier Deleted",
        message: "Supplier has been removed successfully",
      })
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error Deleting Supplier",
        message: error.message,
      })
    }
  }

  // Initialize data
  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const statsData = [
    {
      title: "Total Suppliers",
      value: stats.totalSuppliers?.toString() || "0",
      icon: <FaUsers />,
      iconColor: "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)",
    },
    {
      title: "Active Suppliers",
      value: stats.activeSuppliers?.toString() || "0",
      icon: <FaChartLine />,
      iconColor: "linear-gradient(135deg, #40916c 0%, #2d5016 100%)",
    },
    {
      title: "Total Value",
      value: `$${stats.totalValue?.toLocaleString() || "0"}`,
      icon: <FaDollarSign />,
      iconColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      title: "Avg Rating",
      value: stats.avgRating || "0.0",
      icon: <FaStar />,
      iconColor: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
    },
  ]

  return (
    <Container>
      {/* Stats Grid */}
      <StatsGrid>
        {statsData.map((stat, index) => (
          <StatCard key={index}>
            <StatHeader>
              <div>
                <StatValue>{stat.value}</StatValue>
                <StatLabel>{stat.title}</StatLabel>
              </div>
              <StatIcon iconColor={stat.iconColor}>{stat.icon}</StatIcon>
            </StatHeader>
          </StatCard>
        ))}
      </StatsGrid>

      {/* Action Bar */}
      <ActionBar>
        <SearchContainer>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput type="text" placeholder="Search suppliers..." value={searchQuery} onChange={handleSearch} />
        </SearchContainer>

        <ActionButtons>
          <Button variant="outline">
            <FaFilter /> Filter
          </Button>
          <Button variant="outline">
            <FaDownload /> Export
          </Button>
          <Button variant="primary">
            <FaPlus /> Add Supplier
          </Button>
        </ActionButtons>
      </ActionBar>

      {/* Suppliers Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <LoadingSpinner size="60px" />
        </div>
      ) : error ? (
        <EmptyState>
          <div className="icon">
            <FaExclamationTriangle />
          </div>
          <h3>Error Loading Suppliers</h3>
          <p>{error}</p>
          <Button onClick={() => fetchSuppliers()}>Try Again</Button>
        </EmptyState>
      ) : filteredSuppliers.length === 0 ? (
        <EmptyState>
          <div className="icon">
            <FaUsers />
          </div>
          <h3>No Suppliers Found</h3>
          <p>
            {searchQuery || Object.values(filters).some((f) => f)
              ? "Try adjusting your search or filters."
              : "Add your first supplier to get started."}
          </p>
          <Button variant="primary">
            <FaPlus /> Add Supplier
          </Button>
        </EmptyState>
      ) : (
        <SuppliersGrid>
          {filteredSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} onClick={() => handleViewSupplier(supplier)}>
              <SupplierHeader>
                <SupplierInfo>
                  <SupplierName>
                    <FaBuilding />
                    {supplier.name}
                  </SupplierName>
                  <SupplierCategory>{supplier.category}</SupplierCategory>
                  <StatusBadge status={supplier.status}>{supplier.status}</StatusBadge>
                </SupplierInfo>
                <SupplierActions onClick={(e) => e.stopPropagation()}>
                  <ActionButton title="View Details" onClick={() => handleViewSupplier(supplier)}>
                    <FaEye />
                  </ActionButton>
                  <ActionButton title="Edit Supplier" onClick={() => handleEditSupplier(supplier)}>
                    <FaEdit />
                  </ActionButton>
                  <ActionButton
                    title="Delete Supplier"
                    variant="danger"
                    onClick={() => handleDeleteSupplier(supplier.id)}
                  >
                    <FaTrash />
                  </ActionButton>
                </SupplierActions>
              </SupplierHeader>

              <RatingContainer>
                <StarRating>{renderStars(supplier.rating)}</StarRating>
                <RatingValue>{supplier.rating}</RatingValue>
              </RatingContainer>

              <ContactInfo>
                <ContactItem>
                  <FaPhone />
                  {supplier.phone}
                </ContactItem>
                <ContactItem>
                  <FaEnvelope />
                  {supplier.email}
                </ContactItem>
                <ContactItem>
                  <FaMapMarkerAlt />
                  {supplier.address.split(",").slice(-2).join(",").trim()}
                </ContactItem>
              </ContactInfo>

              <SupplierStats>
                <StatItem>
                  <StatNumber>{supplier.totalOrders}</StatNumber>
                  <StatText>Orders</StatText>
                </StatItem>
                <StatItem>
                  <StatNumber>${(supplier.totalValue / 1000).toFixed(0)}K</StatNumber>
                  <StatText>Value</StatText>
                </StatItem>
                <StatItem>
                  <StatNumber>{supplier.performance?.onTimeDelivery || 0}%</StatNumber>
                  <StatText>On Time</StatText>
                </StatItem>
              </SupplierStats>
            </SupplierCard>
          ))}
        </SuppliersGrid>
      )}
    </Container>
  )
}

export default SupplierManagement
