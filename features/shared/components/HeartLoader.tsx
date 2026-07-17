"use client";

import styled, { keyframes } from "styled-components";

const heartbeat = keyframes`
  0%,
  100% {
    transform: rotate(-45deg) scale(0.9);
    opacity: 0.65;
  }

  30% {
    transform: rotate(-45deg) scale(1.12);
    opacity: 1;
  }

  45% {
    transform: rotate(-45deg) scale(0.98);
  }

  60% {
    transform: rotate(-45deg) scale(1.06);
  }
`;

const HeartShape = styled.div`
  width: 18px;
  aspect-ratio: 1;
  position: relative;
  background: currentColor;
  color: #f59e0b;
  transform: rotate(-45deg);
  animation: ${heartbeat} 0.9s ease-in-out infinite;

  &::before,
  &::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: currentColor;
  }

  &::before {
    top: -50%;
    left: 0;
  }

  &::after {
    top: 0;
    left: 50%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.8;
  }
`;

const Center = styled.div<{ $height: number }>`
  width: 100%;
  height: ${(p) => p.$height}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface Props {
  /** 로딩 표시가 채울 영역 높이(px). 실제 차트 높이와 맞춰 레이아웃이 안 흔들리게 함 */
  height?: number;
}

export default function HeartLoader({ height = 260 }: Props) {
  return (
    <Center $height={height}>
      <HeartShape aria-label="로딩 중" role="status" />
    </Center>
  );
}
