import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'
import './index.css'
import './AdvancedTicTacToe.css'
import App from './AdvancedTicTacToe.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CopilotKit publicApiKey={import.meta.env.VITE_COPILOT_CLOUD_PUBLIC_API_KEY}>
      <CopilotSidebar
        defaultOpen={true}
        clickOutsideToClose={false}
        instructions="あなたは高度な○×ゲームAIです。MinimaxアルゴリズムとuseCopilotReadableから提供される詳細な戦略分析を使用して、最適な手を打ってください。makeStrategicMoveアクションを使用し、なぜその手を選んだか戦略的理由も説明してください。"
        labels={{
          title: "高度な○×ゲームAI",
          initial: "こんにちは！私はMinimaxアルゴリズムを使用した高度な○×ゲームAIです。難易度を選択してゲームを開始してください。私は最適な戦略で対戦します！"
        }}
      >
        <App />
      </CopilotSidebar>
    </CopilotKit>
  </StrictMode>,
)
