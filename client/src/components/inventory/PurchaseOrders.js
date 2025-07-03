"use client"

import { useState, useEffect, useCallback } from "react"
import styled from "styled-components"
import {
  FaTruck,
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaEdit,
  FaCheck,
  FaTimes,
  FaPrint,
  FaCalendar,
  FaDollarSign,
  FaBox,
  FaUser,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaShippingFast,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa"
import Button from "../common/Button"
import Input from "../common/Input"
import LoadingSpinner from "../common/LoadingSpinner"
import Card from "../common/Card"
import { purchaseOrdersAPI } from "../../services/api"
import { useNotifications } from "../../contexts/NotificationContext"
import CreatePurchaseOrderModal from "./CreatePurchaseOrderModal"
import PurchaseOrderDetailsModal from "./PurchaseOrderDetailsModal"

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

const TableContainer = styled.div`
  background: white;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"};
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const TableHeader = styled.thead`
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  cursor: ${(props) => (props.sortable ? "pointer" : "default")};
  user-select: none;

  &:hover {
    background: ${(props) => (props.sortable ? props.theme.colors?.border || "#e2e8f0" : "transparent")};
  }

  .sort-icon {
    margin-left: 0.5rem;
    opacity: ${(props) => (props.sorted ? 1 : 0.3)};
  }
`

const TableBody = styled.tbody``

const TableRow = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  }

  &:last-child {
    border-bottom: none;
  }
`

const TableCell = styled.td`
  padding: 1rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  vertical-align: middle;
`

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  ${(props) => {
    switch (props.status) {
      case "draft":
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
      case "pending":
        return `
          background: ${props.theme.colors?.warning || "#ed8936"}20;
          color: ${props.theme.colors?.warning || "#ed8936"};
        `
      case "approved":
        return `
          background: ${props.theme.colors?.primary || "#1b4332"}20;
          color: ${props.theme.colors?.primary || "#1b4332"};
        `
      case "ordered":
        return `
          background: #667eea20;
          color: #667eea;
        `
      case "received":
        return `
          background: ${props.theme.colors?.success || "#2d5016"}20;
          color: ${props.theme.colors?.success || "#2d5016"};
        `
      case "cancelled":
        return `
          background: ${props.theme.colors?.error || "#c53030"}20;
          color: ${props.theme.colors?.error || "#c53030"};
        `
      default:
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
    }
  }}
`

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
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
        case "success":
          return props.theme.colors?.success || "#2d5016"
        case "danger":
          return props.theme.colors?.error || "#c53030"
        case "warning":
          return props.theme.colors?.warning || "#ed8936"
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

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({
    status: "",
    supplier: "",
    dateRange: "",
  })

  const { addNotification } = useNotifications()

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(
    async (params = {}) => {
      try {
        setLoading(true)
        setError(null)

        const queryParams = {
          search: searchQuery,
          ...filters,
          ...params,
        }

        const response = await purchaseOrdersAPI.getAll(queryParams)
        setPurchaseOrders(response.data || response.orders || [])

        // Calculate stats
        const orders = response.data || response.orders || []
        const totalOrders = orders.length
        const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "approved").length
        const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        const thisMonthOrders = orders.filter((order) => {
          const orderDate = new Date(order.orderDate)
          const now = new Date()
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
        }).length

        setStats({
          totalOrders,
          pendingOrders,
          totalValue,
          thisMonthOrders,
        })
      } catch (err) {
        setError(err.message)
        addNotification({
          type: "error",
          title: "Error Loading Purchase Orders",
          message: err.message,
        })
      } finally {
        setLoading(false)
      }
    },
    [searchQuery, filters, addNotification],
  )

  // Handle search
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  // Handle sort
  const handleSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="sort-icon" />
    }
    return sortConfig.direction === "asc" ? <FaSortUp className="sort-icon" /> : <FaSortDown className="sort-icon" />
  }

  // Create new purchase order
  const handleCreateOrder = async (orderData) => {
    try {
      const response = await purchaseOrdersAPI.create(orderData)
      const newOrder = response.data || response

      setPurchaseOrders((prev) => [newOrder, ...prev])
      setShowCreateModal(false)

      addNotification({
        type: "success",
        title: "Purchase Order Created",
        message: `Order ${newOrder.orderNumber} has been created successfully`,
      })

      await fetchPurchaseOrders()
    } catch (err) {
      addNotification({
        type: "error",
        title: "Error Creating Order",
        message: err.message,
      })
    }
  }

  // Approve order
  const handleApproveOrder = async (id) => {
    try {
      await purchaseOrdersAPI.approve(id)

      setPurchaseOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: "approved" } : order)))

      addNotification({
        type: "success",
        title: "Order Approved",
        message: "Purchase order has been approved",
      })
    } catch (err) {
      addNotification({
        type: "error",
        title: "Error Approving Order",
        message: err.message,
      })
    }
  }

  // Cancel order
  const handleCancelOrder = async (id, reason) => {
    try {
      await purchaseOrdersAPI.cancel(id, reason)

      setPurchaseOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: "cancelled" } : order)))

      addNotification({
        type: "success",
        title: "Order Cancelled",
        message: "Purchase order has been cancelled",
      })
    } catch (err) {
      addNotification({
        type: "error",
        title: "Error Cancelling Order",
        message: err.message,
      })
    }
  }

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  // Export orders
  const handleExport = async () => {
    try {
      // Implementation for export functionality
      addNotification({
        type: "success",
        title: "Export Started",
        message: "Purchase orders export is being prepared",
      })
    } catch (err) {
      addNotification({
        type: "error",
        title: "Export Failed",
        message: err.message,
      })
    }
  }

  // Filter and sort data
  const filteredAndSortedOrders = purchaseOrders
    .filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = !filters.status || order.status === filters.status

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0

      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

  // Get status text and icon
  const getStatusText = (status) => {
    const statusMap = {
      draft: "Draft",
      pending: "Pending",
      approved: "Approved",
      ordered: "Ordered",
      received: "Received",
      cancelled: "Cancelled",
    }
    return statusMap[status] || status
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "draft":
        return <FaEdit />
      case "pending":
        return <FaClock />
      case "approved":
        return <FaCheck />
      case "ordered":
        return <FaShippingFast />
      case "received":
        return <FaBox />
      case "cancelled":
        return <FaTimes />
      default:
        return <FaClock />
    }
  }

  // Initialize data
  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchPurchaseOrders()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, fetchPurchaseOrders])

  const statsData = [
    {
      title: "Total Orders",
      value: stats.totalOrders?.toString() || "0",
      icon: <FaTruck />,
      iconColor: "linear-gradient(135deg, #1b4332 0%, #2d5a47 100%)",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders?.toString() || "0",
      icon: <FaClock />,
      iconColor: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
    },
    {
      title: "Total Value",
      value: `$${stats.totalValue?.toLocaleString() || "0"}`,
      icon: <FaDollarSign />,
      iconColor: "linear-gradient(135deg, #40916c 0%, #2d5016 100%)",
    },
    {
      title: "This Month",
      value: stats.thisMonthOrders?.toString() || "0",
      icon: <FaCalendar />,
      iconColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
          <SearchInput
            type="text"
            placeholder="Search purchase orders..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </SearchContainer>

        <ActionButtons>
          <Button variant="outline">
            <FaFilter /> Filter
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <FaDownload /> Export
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> New Order
          </Button>
        </ActionButtons>
      </ActionBar>

      {/* Purchase Orders Table */}
      <TableContainer>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <LoadingSpinner size="60px" />
          </div>
        ) : error ? (
          <EmptyState>
            <div className="icon">
              <FaExclamationTriangle />
            </div>
            <h3>Error Loading Purchase Orders</h3>
            <p>{error}</p>
            <Button onClick={() => fetchPurchaseOrders()}>Try Again</Button>
          </EmptyState>
        ) : filteredAndSortedOrders.length === 0 ? (
          <EmptyState>
            <div className="icon">
              <FaTruck />
            </div>
            <h3>No Purchase Orders Found</h3>
            <p>
              {searchQuery || filters.status
                ? "Try adjusting your search or filters."
                : "Create your first purchase order to get started."}
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <FaPlus /> Create Purchase Order
            </Button>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell
                  sortable
                  sorted={sortConfig.key === "orderNumber"}
                  onClick={() => handleSort("orderNumber")}
                >
                  Order Number {getSortIcon("orderNumber")}
                </TableHeaderCell>
                <TableHeaderCell sortable sorted={sortConfig.key === "supplier"} onClick={() => handleSort("supplier")}>
                  Supplier {getSortIcon("supplier")}
                </TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell
                  sortable
                  sorted={sortConfig.key === "orderDate"}
                  onClick={() => handleSort("orderDate")}
                >
                  Order Date {getSortIcon("orderDate")}
                </TableHeaderCell>
                <TableHeaderCell
                  sortable
                  sorted={sortConfig.key === "expectedDate"}
                  onClick={() => handleSort("expectedDate")}
                >
                  Expected Date {getSortIcon("expectedDate")}
                </TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell
                  sortable
                  sorted={sortConfig.key === "totalAmount"}
                  onClick={() => handleSort("totalAmount")}
                >
                  Total Amount {getSortIcon("totalAmount")}
                </TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredAndSortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div style={{ fontWeight: "600" }}>{order.orderNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FaUser size={14} />
                      {order.supplier}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(order.expectedDate).toLocaleDateString()}</TableCell>
                  <TableCell>{order.items || order.itemCount || 0} items</TableCell>
                  <TableCell>
                    <div style={{ fontWeight: "600" }}>${order.totalAmount?.toLocaleString() || "0"}</div>
                  </TableCell>
                  <TableCell>
                    <ActionButtonGroup>
                      <ActionButton title="View Details" onClick={() => handleViewOrder(order)}>
                        <FaEye />
                      </ActionButton>
                      {order.status === "pending" && (
                        <ActionButton
                          title="Approve Order"
                          variant="success"
                          onClick={() => handleApproveOrder(order.id)}
                        >
                          <FaCheck />
                        </ActionButton>
                      )}
                      <ActionButton title="Print Order">
                        <FaPrint />
                      </ActionButton>
                      {(order.status === "draft" || order.status === "pending") && (
                        <ActionButton
                          title="Cancel Order"
                          variant="danger"
                          onClick={() => handleCancelOrder(order.id, "Cancelled by user")}
                        >
                          <FaTimes />
                        </ActionButton>
                      )}
                    </ActionButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Modals */}
      {showCreateModal && (
        <CreatePurchaseOrderModal onClose={() => setShowCreateModal(false)} onSave={handleCreateOrder} />
      )}

      {showDetailsModal && selectedOrder && (
        <PurchaseOrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedOrder(null)
          }}
          onUpdate={fetchPurchaseOrders}
        />
      )}
    </Container>
  )
}

export default PurchaseOrders
