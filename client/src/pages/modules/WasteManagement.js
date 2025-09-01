"use client"

import { useState } from "react"
import styled from "styled-components"
import {
  FaRecycle,
  FaTrash,
  FaDollarSign,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaEdit,
  FaEye,
  FaDownload,
  FaLeaf,
  FaIndustry,
  FaShoppingCart,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa"
import Card from "../../components/common/Card"
import Button from "../../components/common/Button"

const WasteContainer = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  min-height: 100vh;
`

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  padding: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 250px;
    height: 250px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(30%, -30%);
  }
`

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
`

const HeaderTitle = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.["3xl"] || "1.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  margin-bottom: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const HeaderSubtitle = styled.p`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  opacity: 0.9;
  margin: 0;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
`

const StatCard = styled(Card)`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(240, 147, 251, 0.1)"};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${(props) => props.theme.shadows?.glowLarge || "0 0 40px rgba(245, 87, 108, 0.2)"};
  }
`

const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing?.xl || "2rem"};
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
`

const CategoryCard = styled(Card)`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: none;
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(240, 147, 251, 0.1)"};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => props.gradient || "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"};
  }
`

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const CategoryIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  background: ${(props) => props.gradient || "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: ${(props) => props.theme.shadows?.glow || "0 0 20px rgba(240, 147, 251, 0.3)"};
`

const CategoryInfo = styled.div`
  flex: 1;
  margin-left: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const CategoryName = styled.h3`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const CategoryStats = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
`

const CategoryMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  margin-bottom: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const MetricItem = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
`

const MetricValue = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const MetricLabel = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const TransactionsSection = styled.div`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-radius: ${(props) => props.theme.borderRadius?.xl || "1rem"};
  box-shadow: ${(props) => props.theme.shadows?.lg || "0 10px 15px -3px rgba(240, 147, 251, 0.1)"};
  overflow: hidden;
  margin-bottom: ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
`

const SectionHeader = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
`

const SectionTitle = styled.h2`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
`

const TransactionsList = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
`

const TransactionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceDark || "#edf2f7"};
    transform: translateX(4px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`

const TransactionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  flex: 1;
`

const TransactionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) => props.gradient || "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
`

const TransactionDetails = styled.div``

const TransactionTitle = styled.div`
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const TransactionMeta = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
`

const TransactionAmount = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.success || "#2d5016"};
`

const TransactionStatus = styled.div`
  padding: ${(props) => props.theme.spacing?.xs || "0.25rem"} ${(props) => props.theme.spacing?.sm || "0.5rem"};
  border-radius: ${(props) => props.theme.borderRadius?.full || "9999px"};
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: ${(props) => props.theme.spacing?.md || "1rem"};

  ${(props) => {
    switch (props.status) {
      case "completed":
        return `
          background: ${props.theme.colors?.success || "#2d5016"}20;
          color: ${props.theme.colors?.success || "#2d5016"};
        `
      case "pending":
        return `
          background: ${props.theme.colors?.warning || "#ed8936"}20;
          color: ${props.theme.colors?.warning || "#ed8936"};
        `
      case "processing":
        return `
          background: ${props.theme.colors?.info || "#1b4332"}20;
          color: ${props.theme.colors?.info || "#1b4332"};
        `
      default:
        return `
          background: ${props.theme.colors?.textSecondary || "#718096"}20;
          color: ${props.theme.colors?.textSecondary || "#718096"};
        `
    }
  }}
`

const WasteManagement = () => {
  const [wasteData, setWasteData] = useState({
    categories: [
      {
        id: 1,
        name: "Organic Waste",
        type: "organic",
        icon: <FaLeaf />,
        gradient: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
        weight: "1,245 kg",
        revenue: "$12,450",
        partners: 8,
        trend: "+15.3%",
      },
      {
        id: 2,
        name: "Recyclable Materials",
        type: "recyclable",
        icon: <FaRecycle />,
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        weight: "892 kg",
        revenue: "$8,920",
        partners: 12,
        trend: "+22.1%",
      },
      {
        id: 3,
        name: "Industrial Waste",
        type: "industrial",
        icon: <FaIndustry />,
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        weight: "567 kg",
        revenue: "$5,670",
        partners: 5,
        trend: "+8.7%",
      },
      {
        id: 4,
        name: "Food Surplus",
        type: "food",
        icon: <FaShoppingCart />,
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        weight: "234 kg",
        revenue: "$2,340",
        partners: 15,
        trend: "+31.2%",
      },
    ],
    transactions: [
      {
        id: 1,
        title: "Green Valley Farms",
        description: "Organic waste collection - 150 kg",
        amount: "$1,500",
        status: "completed",
        date: "2 hours ago",
        icon: <FaLeaf />,
        gradient: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
      },
      {
        id: 2,
        title: "EcoRecycle Co.",
        description: "Mixed recyclables - 75 kg",
        amount: "$750",
        status: "processing",
        date: "4 hours ago",
        icon: <FaRecycle />,
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      },
      {
        id: 3,
        title: "City Food Bank",
        description: "Food surplus donation - 50 kg",
        amount: "$500",
        status: "pending",
        date: "6 hours ago",
        icon: <FaShoppingCart />,
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
      {
        id: 4,
        title: "Industrial Solutions Ltd",
        description: "Metal scrap collection - 200 kg",
        amount: "$2,000",
        status: "completed",
        date: "1 day ago",
        icon: <FaIndustry />,
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
    ],
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle />
      case "pending":
        return <FaClock />
      case "processing":
        return <FaExclamationTriangle />
      default:
        return <FaClock />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "pending":
        return "Pending"
      case "processing":
        return "Processing"
      default:
        return "Unknown"
    }
  }

  return (
    <WasteContainer>
      <HeaderSection>
        <HeaderContent>
          <HeaderTitle>Waste Management & Sales</HeaderTitle>
          <HeaderSubtitle>
            Transform waste into revenue through sustainable practices and strategic partnerships
          </HeaderSubtitle>
        </HeaderContent>
      </HeaderSection>

      <StatsGrid>
        <StatCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>
                $89,432
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#718096",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Monthly Revenue
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #2d5016 0%, #52734d 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaDollarSign />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#2d5016",
            }}
          >
            <FaChartLine />
            +18.5% from last month
          </div>
        </StatCard>

        <StatCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>
                2,847 kg
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#718096",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Waste Processed
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaRecycle />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#2d5016",
            }}
          >
            <FaChartLine />
            +25.3% efficiency
          </div>
        </StatCard>

        <StatCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>
                45
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#718096",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Active Partners
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaUsers />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#2d5016",
            }}
          >
            <FaChartLine />
            +12 new partners
          </div>
        </StatCard>

        <StatCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#2d3748", marginBottom: "0.25rem" }}>
                12
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#718096",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Pending Orders
              </div>
            </div>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              <FaTrash />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#2d5016",
            }}
          >
            <FaChartLine />
            Processing queue
          </div>
        </StatCard>
      </StatsGrid>

      <CategoriesGrid>
        {wasteData.categories.map((category) => (
          <CategoryCard key={category.id} gradient={category.gradient}>
            <CategoryHeader>
              <CategoryIcon gradient={category.gradient}>{category.icon}</CategoryIcon>
              <CategoryInfo>
                <CategoryName>{category.name}</CategoryName>
                <CategoryStats>
                  {category.weight} this month • {category.partners} partners
                </CategoryStats>
              </CategoryInfo>
            </CategoryHeader>

            <CategoryMetrics>
              <MetricItem>
                <MetricValue>{category.revenue}</MetricValue>
                <MetricLabel>Revenue</MetricLabel>
              </MetricItem>
              <MetricItem>
                <MetricValue>{category.trend}</MetricValue>
                <MetricLabel>Growth</MetricLabel>
              </MetricItem>
            </CategoryMetrics>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button variant="outline" size="sm">
                <FaEye /> View
              </Button>
              <Button variant="primary" size="sm">
                <FaEdit /> Manage
              </Button>
            </div>
          </CategoryCard>
        ))}
      </CategoriesGrid>

      <TransactionsSection>
        <SectionHeader>
          <SectionTitle>
            <FaDollarSign /> Recent Transactions
          </SectionTitle>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="outline" size="sm">
              <FaDownload /> Export
            </Button>
            <Button variant="primary" size="sm">
              <FaPlus /> New Transaction
            </Button>
          </div>
        </SectionHeader>

        <TransactionsList>
          {wasteData.transactions.map((transaction) => (
            <TransactionItem key={transaction.id}>
              <TransactionInfo>
                <TransactionIcon gradient={transaction.gradient}>{transaction.icon}</TransactionIcon>
                <TransactionDetails>
                  <TransactionTitle>{transaction.title}</TransactionTitle>
                  <TransactionMeta>
                    {transaction.description} • {transaction.date}
                  </TransactionMeta>
                </TransactionDetails>
              </TransactionInfo>
              <div style={{ display: "flex", alignItems: "center" }}>
                <TransactionAmount>{transaction.amount}</TransactionAmount>
                <TransactionStatus status={transaction.status}>
                  {getStatusIcon(transaction.status)}
                  {getStatusText(transaction.status)}
                </TransactionStatus>
              </div>
            </TransactionItem>
          ))}
        </TransactionsList>
      </TransactionsSection>
    </WasteContainer>
  )
}

export default WasteManagement
