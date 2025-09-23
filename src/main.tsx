import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CopilotKit publicApiKey={import.meta.env.VITE_COPILOT_CLOUD_PUBLIC_API_KEY}>
      <CopilotSidebar
        defaultOpen={true}
        clickOutsideToClose={false}
        instructions="あなたは○×ゲーム（三目並べ）をプレイしています。あなたはOプレイヤーで、人間がXプレイヤーです。'AI turn trigger'のreadableがあなたのターンを示したら（isAITurn: true）、すぐにボードを分析してmakeMoveアクションを使って手を打ってください。戦略的な手を打って勝利を目指してください。"
        labels={{
          title: "○×ゲーム AI",
          initial: "こんにちは！私はあなたの○×ゲームの対戦相手です。私はOで対戦します。まずはXで先手をどうぞ！"
        }}
      >
        <App />
      </CopilotSidebar>
    </CopilotKit>
  </StrictMode>,
)
