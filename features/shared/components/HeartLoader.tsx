"use client";

import styled, { keyframes } from "styled-components";



interface Props {
  /** 로딩 표시가 채울 영역 높이(px). 실제 차트 높이와 맞춰 레이아웃이 안 흔들리게 함 */
  height?: number;
}

export default function HeartLoader({ height = 260 }: Props) {
  return (
    <Center $height={height}>
      <Circle>
      <HeartShape
        width="86"
        height="72"
        viewBox="0 0 86 72"
        fill="none"
      >
        <path
          d="M43 69
            C39 66 8 49 3 27
            C0 14 7 3 19 2
            C29 1 38 7 43 16
            C48 7 57 1 67 2
            C79 3 86 14 83 27
            C78 49 47 66 43 69
            Z"
          fill="currentColor"
        />
      </HeartShape>
      </Circle>
    </Center>
  );
}

const circle = keyframes`
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }

  32% {
    transform: scale(1.05);
    opacity: 0.9;
  }

  46% {
    transform: scale(0.95);
    opacity: 0.8;
  }

  61% {
    transform:  scale(1.2);
    opacity: 0.9;
  }
`;


const Circle = styled.div`
position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  
  &::before {
    width:160px;
    height:160px;
    background-image: radial-gradient(circle at center, rgba(255, 63, 144, 0.35), rgba(255, 63, 144, 0) 70%);
    border-radius: 50%;
    position: absolute;
    content: '';

    top: calc(50% - 80px);
    left:  calc(50% - 80px);
    animation: ${circle} 1s ease-in-out infinite;
  }
`

const heartbeat = keyframes`
  0%,
  100% {
    transform: scale(0.95);
  }

  30% {
    transform: scale(1,1.12);
  }

  45% {
    transform: scale(0.97, 0.98);
  }

  60% {
    transform:  scale(1, 1.06);
  }
`;

const HeartShape = styled.svg`
  color: #F94F63;
    
  animation: ${heartbeat} 1s ease-in-out infinite;

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
