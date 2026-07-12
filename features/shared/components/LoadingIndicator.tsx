"use client";

import styled, { keyframes } from "styled-components";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";

const heartbeat = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
`;

const PulsingIcon = styled(MonitorHeartIcon)`
  color: #ef4444;
  animation: ${heartbeat} 1s ease-in-out infinite;
`;

const Label = styled.p`
  font-size: 0.875rem;
  color: var(--muted-foreground, #71717a);
`;

interface Props {
  label?: string;
}

export default function LoadingIndicator({ label = "불러오는 중..." }: Props) {
  return (
    <Wrapper>
      <PulsingIcon fontSize="large" />
      <Label>{label}</Label>
    </Wrapper>
  );
}
