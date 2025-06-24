"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import styled from "styled-components"
import { motion } from "framer-motion"
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa"
import axios from "axios"
import toast from "react-hot-toast"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import Card from "../../components/common/Card"
import Logo from "../../components/common/Logo"

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spacing[6]};
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(45, 125, 45, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(51, 65, 85, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(45, 125, 45, 0.1) 0%, transparent 50%);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
`

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: ${(props) => props.theme.spacing[8]};

  .logo-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: ${(props) => props.theme.spacing[6]};
  }

  h1 {
    font-size: ${(props) => props.theme.typography.fontSize["3xl"][0]};
    font-weight: ${(props) => props.theme.typography.fontWeight.bold};
    color: ${(props) => props.theme.colors.white};
    margin-bottom: ${(props) => props.theme.spacing[2]};
    letter-spacing: -0.025em;
  }

  p {
    font-size: ${(props) => props.theme.typography.fontSize.lg[0]};
    color: rgba(255, 255, 255, 0.8);
    font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  }
`

const StyledCard = styled(Card)`
  padding: ${(props) => props.theme.spacing[8]};
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: ${(props) => props.theme.shadows.xl};
  backdrop-filter: blur(20px);

  @media (max-width: ${(props) => props.theme.breakpoints.sm}) {
    padding: ${(props) => props.theme.spacing[6]};
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing[6]};
`

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing[2]};
  color: ${(props) => props.theme.colors.accent.main};
  font-size: ${(props) => props.theme.typography.fontSize.sm[0]};
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: ${(props) => props.theme.typography.fontWeight.medium};
  margin-bottom: ${(props) => props.theme.spacing[6]};

  &:hover {
    color: ${(props) => props.theme.colors.accent.dark};
  }
`

const SuccessMessage = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing[8]};

  .icon {
    width: 80px;
    height: 80px;
    background: ${(props) => props.theme.colors.accent.gradient};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto ${(props) => props.theme.spacing[6]};
    font-size: 40px;
    color: white;
  }

  h2 {
    color: ${(props) => props.theme.colors.text.primary};
    font-size: ${(props) => props.theme.typography.fontSize["2xl"][0]};
    font-weight: ${(props) => props.theme.typography.fontWeight.bold};
    margin-bottom: ${(props) => props.theme.spacing[4]};
  }

  p {
    color: ${(props) => props.theme.colors.text.secondary};
    font-size: ${(props) => props.theme.typography.fontSize.lg[0]};
    line-height: 1.6;
    margin-bottom: ${(props) => props.theme.spacing[8]};
  }
`

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await axios.post("/auth/forgot-password", { email: data.email })
      setEmail(data.email)
      setEmailSent(true)
      toast.success("Password reset email sent!")
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send reset email"
      toast.error(message)
    }
    setLoading(false)
  }

  if (emailSent) {
    return (
      <Container>
        <FormContainer initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Header>
            <div className="logo-wrapper">
              <Logo size="64px" />
            </div>
            <h1>Check Your Email</h1>
          </Header>

          <StyledCard>
            <SuccessMessage>
              <div className="icon">
                <FaCheckCircle />
              </div>
              <h2>Email Sent Successfully!</h2>
              <p>
                We've sent a password reset link to <strong>{email}</strong>. Please check your email and follow the
                instructions to reset your password.
              </p>
              <Button as={Link} to="/login" fullWidth>
                Back to Login
              </Button>
            </SuccessMessage>
          </StyledCard>
        </FormContainer>
      </Container>
    )
  }

  return (
    <Container>
      <FormContainer initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Header>
          <div className="logo-wrapper">
            <Logo size="64px" />
          </div>
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a password reset link</p>
        </Header>

        <StyledCard>
          <BackLink to="/login">
            <FaArrowLeft />
            Back to Login
          </BackLink>

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Input
              icon={FaEnvelope}
              type="email"
              placeholder="Email Address"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              error={errors.email?.message}
            />

            <Button type="submit" loading={loading} fullWidth>
              Send Reset Link
            </Button>
          </Form>
        </StyledCard>
      </FormContainer>
    </Container>
  )
}

export default ForgotPassword
