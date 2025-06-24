"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import styled from "styled-components"
import { motion } from "framer-motion"
import { FaLock, FaCheckCircle, FaTimesCircle } from "react-icons/fa"
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

const StatusIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${(props) => props.theme.spacing[6]};
  font-size: 40px;
  color: ${(props) => props.theme.colors.white};
  background: ${(props) => (props.$success ? props.theme.colors.accent.gradient : props.theme.colors.error.main)};
`

const Message = styled.div`
  text-align: center;
  margin-bottom: ${(props) => props.theme.spacing[8]};

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
  }
`

const PasswordRequirements = styled.div`
  background: ${(props) => props.theme.colors.background.light};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: ${(props) => props.theme.spacing[4]};
  margin-bottom: ${(props) => props.theme.spacing[6]};

  h4 {
    font-size: ${(props) => props.theme.typography.fontSize.sm[0]};
    font-weight: ${(props) => props.theme.typography.fontWeight.semibold};
    color: ${(props) => props.theme.colors.text.primary};
    margin-bottom: ${(props) => props.theme.spacing[2]};
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    font-size: ${(props) => props.theme.typography.fontSize.xs[0]};
    color: ${(props) => props.theme.colors.text.secondary};
    margin-bottom: 2px;
    padding-left: 16px;
    position: relative;

    &::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${(props) => props.theme.colors.accent.main};
    }
  }
`

const SetPassword = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("form") // form, success, error
  const [message, setMessage] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm()

  const password = watch("password")

  useEffect(() => {
    // Verify if the userId is valid
    if (!userId) {
      setStatus("error")
      setMessage("Invalid password setup link.")
    }
  }, [userId])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await axios.post(`/auth/set-password/${userId}`, {
        password: data.password,
      })

      setStatus("success")
      setMessage("Password set successfully! You can now log in with your new password.")
      toast.success("Password set successfully!")

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to set password. Please try again."
      setStatus("error")
      setMessage(errorMessage)
      toast.error(errorMessage)
    }
    setLoading(false)
  }

  if (status === "success" || status === "error") {
    return (
      <Container>
        <FormContainer initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Header>
            <div className="logo-wrapper">
              <Logo size="64px" />
            </div>
            <h1>Password Setup</h1>
          </Header>

          <StyledCard>
            <StatusIcon $success={status === "success"}>
              {status === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
            </StatusIcon>

            <Message>
              <h2>{status === "success" ? "Password Set Successfully!" : "Setup Failed"}</h2>
              <p>{message}</p>
            </Message>

            <Button fullWidth onClick={() => navigate("/login")}>
              {status === "success" ? "Continue to Login" : "Back to Login"}
            </Button>
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
          <h1>Set Your Password</h1>
          <p>Create a secure password for your account</p>
        </Header>

        <StyledCard>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <PasswordRequirements>
              <h4>Password Requirements:</h4>
              <ul>
                <li>At least 6 characters long</li>
                <li>Contains uppercase letter (A-Z)</li>
                <li>Contains lowercase letter (a-z)</li>
                <li>Contains at least one number (0-9)</li>
              </ul>
            </PasswordRequirements>

            <Input
              icon={FaLock}
              type="password"
              placeholder="New Password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: "Password must contain uppercase, lowercase, and number",
                },
              })}
              error={errors.password?.message}
            />

            <Input
              icon={FaLock}
              type="password"
              placeholder="Confirm Password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) => value === password || "Passwords do not match",
              })}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" loading={loading} fullWidth>
              Set Password
            </Button>
          </Form>
        </StyledCard>
      </FormContainer>
    </Container>
  )
}

export default SetPassword
