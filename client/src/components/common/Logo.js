import styled from "styled-components"

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const LogoIcon = styled.div`
  width: ${(props) => props.$size || "40px"};
  height: ${(props) => props.$size || "40px"};
  background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: ${(props) => {
    const size = Number.parseInt(props.$size || "40")
    return `${Math.floor(size * 0.4)}px`
  }};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
`

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
  
  .brand {
    font-size: ${(props) => (props.$textSize === "lg" ? "1.125rem" : "1rem")};
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
  }
  
  .tagline {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    line-height: 1;
  }
`

const Logo = ({ size = "40px", textSize = "base", showText = true, showTagline = true, ...props }) => {
  return (
    <LogoContainer {...props}>
      <LogoIcon $size={size}>MP</LogoIcon>
      {showText && (
        <LogoText $textSize={textSize}>
          <div className="brand">ManagePro</div>
          {showTagline && <div className="tagline">Business Suite</div>}
        </LogoText>
      )}
    </LogoContainer>
  )
}

export default Logo
