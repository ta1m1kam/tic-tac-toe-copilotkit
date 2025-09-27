import { useState, useEffect, useRef, useMemo } from 'react'
import { useCopilotAction, useCopilotReadable, useCopilotChat, useCoAgentStateRender } from '@copilotkit/react-core'
import { TextMessage, MessageRole } from '@copilotkit/runtime-client-gql'
import './App.css'
import './AdvancedTicTacToe.css'

type SquareValue = 'X' | 'O' | null
type GamePhase = 'opening' | 'middle' | 'endgame'
type Difficulty = 'beginner' | 'intermediate' | 'expert'

// Minimaxアルゴリズム実装
class MinimaxAI {
  private maxDepth: number

  constructor(difficulty: Difficulty) {
    this.maxDepth = difficulty === 'expert' ? 9 : difficulty === 'intermediate' ? 5 : 2
  }

  getBestMove(board: SquareValue[], isMaximizing: boolean): { position: number; score: number } {
    const availableMoves = board
      .map((val, idx) => val === null ? idx : null)
      .filter(idx => idx !== null) as number[]

    if (availableMoves.length === 0) {
      return { position: -1, score: 0 }
    }

    let bestMove = availableMoves[0]
    let bestScore = isMaximizing ? -Infinity : Infinity

    for (const move of availableMoves) {
      const newBoard = [...board]
      newBoard[move] = isMaximizing ? 'O' : 'X'
      const score = this.minimax(newBoard, 0, !isMaximizing)

      if (isMaximizing && score > bestScore) {
        bestScore = score
        bestMove = move
      } else if (!isMaximizing && score < bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return { position: bestMove, score: bestScore }
  }

  private minimax(board: SquareValue[], depth: number, isMaximizing: boolean): number {
    const winner = calculateWinner(board)

    if (winner === 'O') return 10 - depth
    if (winner === 'X') return depth - 10
    if (board.every(cell => cell !== null)) return 0
    if (depth >= this.maxDepth) return this.evaluatePosition(board)

    const availableMoves = board
      .map((val, idx) => val === null ? idx : null)
      .filter(idx => idx !== null) as number[]

    if (isMaximizing) {
      let maxScore = -Infinity
      for (const move of availableMoves) {
        const newBoard = [...board]
        newBoard[move] = 'O'
        const score = this.minimax(newBoard, depth + 1, false)
        maxScore = Math.max(maxScore, score)
      }
      return maxScore
    } else {
      let minScore = Infinity
      for (const move of availableMoves) {
        const newBoard = [...board]
        newBoard[move] = 'X'
        const score = this.minimax(newBoard, depth + 1, true)
        minScore = Math.min(minScore, score)
      }
      return minScore
    }
  }

  private evaluatePosition(board: SquareValue[]): number {
    let score = 0
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6] // diagonals
    ]

    for (const line of lines) {
      const lineScore = this.evaluateLine(board, line)
      score += lineScore
    }

    // センター優先
    if (board[4] === 'O') score += 3
    if (board[4] === 'X') score -= 3

    // コーナー優先
    const corners = [0, 2, 6, 8]
    for (const corner of corners) {
      if (board[corner] === 'O') score += 1
      if (board[corner] === 'X') score -= 1
    }

    return score
  }

  private evaluateLine(board: SquareValue[], positions: number[]): number {
    let oCount = 0
    let xCount = 0

    for (const pos of positions) {
      if (board[pos] === 'O') oCount++
      if (board[pos] === 'X') xCount++
    }

    if (xCount > 0 && oCount > 0) return 0 // ブロックされている
    if (oCount === 2) return 5
    if (oCount === 1) return 1
    if (xCount === 2) return -5
    if (xCount === 1) return -1

    return 0
  }
}

// 戦略分析コンポーネント
function StrategyAnalysis() {
  useCoAgentStateRender({
    name: 'tictactoe_strategy',
    render: ({ state }) => {
      if (!state?.analysis) return null

      return (
        <div className="strategy-card">
          <h4 className="strategy-title">🧠 AI戦略分析</h4>
          {state.analysis.currentPhase && (
            <div className="phase-indicator">
              ゲームフェーズ: <strong>{state.analysis.currentPhase}</strong>
            </div>
          )}
          {state.analysis.threatLevel && (
            <div className="threat-level">
              脅威レベル:
              <span className={`threat-${state.analysis.threatLevel}`}>
                {state.analysis.threatLevel}
              </span>
            </div>
          )}
          {state.analysis.strategy && (
            <div className="strategy-text">
              {state.analysis.strategy}
            </div>
          )}
        </div>
      )
    }
  })
  return null
}

interface SquareProps {
  value: SquareValue
  onSquareClick: () => void
  isWinningSquare?: boolean
  isCritical?: boolean
  moveScore?: number
}

function Square({ value, onSquareClick, isWinningSquare, isCritical, moveScore }: SquareProps) {
  return (
    <button
      className={`square ${isWinningSquare ? 'winning-square' : ''} ${isCritical ? 'critical-square' : ''}`}
      onClick={onSquareClick}
    >
      {value}
      {!value && moveScore !== undefined && (
        <span className="move-score">{moveScore}</span>
      )}
    </button>
  )
}

interface BoardProps {
  xIsNext: boolean
  squares: SquareValue[]
  onPlay: (nextSquares: SquareValue[]) => void
  winningLine?: number[]
  criticalPositions?: number[]
  moveScores?: Map<number, number>
}

function Board({ xIsNext, squares, onPlay, winningLine, criticalPositions, moveScores }: BoardProps) {
  function handleClick(i: number) {
    if (calculateWinner(squares) || squares[i]) {
      return
    }
    const nextSquares = squares.slice()
    nextSquares[i] = xIsNext ? 'X' : 'O'
    onPlay(nextSquares)
  }

  const winner = calculateWinner(squares)
  let status: string
  if (winner) {
    status = '🏆 勝者: ' + winner
  } else if (squares.every(square => square !== null)) {
    status = '🤝 引き分け'
  } else {
    status = '次: ' + (xIsNext ? 'X (あなた)' : 'O (AI)')
  }

  return (
    <div className='board'>
      <div className="status">{status}</div>
      {[0, 1, 2].map(row => (
        <div key={row} className="board-row">
          {[0, 1, 2].map(col => {
            const i = row * 3 + col
            return (
              <Square
                key={i}
                value={squares[i]}
                onSquareClick={() => handleClick(i)}
                isWinningSquare={winningLine?.includes(i)}
                isCritical={criticalPositions?.includes(i)}
                moveScore={moveScores?.get(i)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function AdvancedTicTacToe() {
  const [history, setHistory] = useState<SquareValue[][]>([Array(9).fill(null)])
  const [currentMove, setCurrentMove] = useState(0)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('expert')
  const [showHints, setShowHints] = useState(false)

  const xIsNext = currentMove % 2 === 0
  const currentSquares = history[currentMove]
  const winnerData = calculateWinnerWithLine(currentSquares)
  const winner = winnerData?.winner
  const winningLine = winnerData?.line
  const { appendMessage } = useCopilotChat()
  const aiRef = useRef(new MinimaxAI(difficulty))
  const renderCount = useRef(0)

  // AIを更新
  useEffect(() => {
    aiRef.current = new MinimaxAI(difficulty)
  }, [difficulty])

  // ゲームフェーズの判定
  const gamePhase = useMemo((): GamePhase => {
    const moveCount = currentSquares.filter(s => s !== null).length
    if (moveCount <= 2) return 'opening'
    if (moveCount <= 6) return 'middle'
    return 'endgame'
  }, [currentSquares])

  // 戦略的分析
  const strategicAnalysis = useMemo(() => {
    const criticalPositions: number[] = []
    const moveScores = new Map<number, number>()

    // 各空きマスのスコアを計算
    currentSquares.forEach((square, idx) => {
      if (square === null) {
        const testBoard = [...currentSquares]

        // プレイヤーが次に打った場合
        testBoard[idx] = 'X'
        if (calculateWinner(testBoard) === 'X') {
          criticalPositions.push(idx)
          moveScores.set(idx, -100)
        }

        // AIが次に打った場合
        testBoard[idx] = 'O'
        if (calculateWinner(testBoard) === 'O') {
          criticalPositions.push(idx)
          moveScores.set(idx, 100)
        }

        // それ以外の場合はMinimaxでスコア計算
        if (!moveScores.has(idx)) {
          testBoard[idx] = 'O'
          const score = aiRef.current.getBestMove(testBoard, false).score
          moveScores.set(idx, Math.round(score * 10))
        }
      }
    })

    return { criticalPositions, moveScores }
  }, [currentSquares])

  // 脅威レベルの判定
  const threatLevel = useMemo(() => {
    const playerWinNextMove = strategicAnalysis.criticalPositions.some(pos => {
      const testBoard = [...currentSquares]
      testBoard[pos] = 'X'
      return calculateWinner(testBoard) === 'X'
    })

    if (playerWinNextMove) return 'high'
    if (strategicAnalysis.criticalPositions.length > 0) return 'medium'
    return 'low'
  }, [currentSquares, strategicAnalysis])

  // 高度な戦略情報をCopilotKitと共有
  useCopilotReadable({
    description: "高度な○×ゲーム戦略分析",
    value: {
      board: currentSquares.map((value, index) => ({
        position: index,
        value: value || '空き',
        coordinates: { row: Math.floor(index / 3), col: index % 3 },
        isCenter: index === 4,
        isCorner: [0, 2, 6, 8].includes(index),
        isEdge: [1, 3, 5, 7].includes(index)
      })),

      gamePhase,
      difficulty,
      currentPlayer: xIsNext ? 'X (人間)' : 'O (AI)',

      strategicAnalysis: {
        winProbability: calculateWinProbability(currentSquares),
        criticalPositions: strategicAnalysis.criticalPositions,
        bestMove: !xIsNext ? aiRef.current.getBestMove(currentSquares, true) : null,
        threatLevel,
        possibleOutcomes: analyzePossibleOutcomes()
      },

      patterns: {
        hasFork: detectFork(),
        hasBlockableFork: detectBlockableFork(),
        controlsCenter: currentSquares[4] !== null,
        cornerControl: countCornerControl(currentSquares)
      },

      recommendation: generateStrategicRecommendation(
        gamePhase,
        strategicAnalysis.criticalPositions
      ),

      debug: {
        renderCount: renderCount.current++,
        lastUpdate: new Date().toISOString(),
        moveScores: Array.from(strategicAnalysis.moveScores.entries())
      }
    }
  })

  // AIアクション
  useCopilotAction({
    name: "makeStrategicMove",
    description: "高度な戦略に基づいて○×ゲームに手を打つ",
    parameters: [
      {
        name: "position",
        type: "number",
        description: "AIが選択した位置（0-8）",
        required: true
      },
      {
        name: "strategy",
        type: "string",
        description: "この手の戦略的理由",
        required: false
      }
    ],
    handler: ({ position, strategy }) => {
      if (xIsNext) {
        return "人間のターンです"
      }
      if (winner || currentSquares.every(square => square !== null)) {
        return "ゲーム終了"
      }
      if (currentSquares[position] !== null) {
        return `位置 ${position} は埋まっています`
      }

      const nextSquares = currentSquares.slice()
      nextSquares[position] = 'O'
      handlePlay(nextSquares)

      return `AI: 位置 ${position} に配置${strategy ? ` (${strategy})` : ''}`
    }
  })

  // AI自動実行
  useEffect(() => {
    const makeAIMove = async () => {
      if (!xIsNext && !winner && !currentSquares.every(square => square !== null)) {
        setIsAIThinking(true)

        // Minimaxで最適手を計算
        const bestMove = aiRef.current.getBestMove(currentSquares, true)

        // 戦略的理由を生成
        let strategy = ''
        if (strategicAnalysis.criticalPositions.includes(bestMove.position)) {
          const testBoard = [...currentSquares]
          testBoard[bestMove.position] = 'O'
          if (calculateWinner(testBoard) === 'O') {
            strategy = '勝利の手'
          } else {
            strategy = '相手の勝利を阻止'
          }
        } else if (gamePhase === 'opening' && bestMove.position === 4) {
          strategy = 'センターをコントロール'
        } else if (gamePhase === 'opening' && [0, 2, 6, 8].includes(bestMove.position)) {
          strategy = 'コーナー戦略'
        }

        const message = new TextMessage({
          role: MessageRole.User,
          content: `makeStrategicMoveアクションを使って位置${bestMove.position}に手を打ってください。戦略: ${strategy || '最適手'}`,
        })

        await appendMessage(message)

        setTimeout(() => {
          setIsAIThinking(false)
        }, 300)
      }
    }

    makeAIMove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xIsNext, winner, currentSquares, gamePhase, strategicAnalysis])

  function handlePlay(nextSquares: SquareValue[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares]
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)
  }

  function resetGame() {
    setHistory([Array(9).fill(null)])
    setCurrentMove(0)
  }

  return (
    <div className="advanced-game-container">
      <div className="game-header">
        <h1>🎮 高度な○×ゲームAI</h1>
        <div className="controls">
          <label>
            難易度:
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="expert">エキスパート</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={showHints}
              onChange={(e) => setShowHints(e.target.checked)}
            />
            ヒント表示
          </label>
        </div>
      </div>

      <div className="game-content">
        <div className="game-board">
          <Board
            xIsNext={xIsNext}
            squares={currentSquares}
            onPlay={handlePlay}
            winningLine={winningLine}
            criticalPositions={showHints ? strategicAnalysis.criticalPositions : undefined}
            moveScores={showHints ? strategicAnalysis.moveScores : undefined}
          />
          {isAIThinking && (
            <div className="ai-thinking">
              <div className="thinking-spinner" />
              <span>AIが{difficulty === 'expert' ? '完璧な' : '最適な'}手を計算中...</span>
            </div>
          )}
          <button className="reset-button" onClick={resetGame}>
            新しいゲーム
          </button>
        </div>

        <div className="analysis-panel">
          <StrategyAnalysis />

          <div className="game-info">
            <h3>📈 ゲーム情報</h3>
            <p>フェーズ: {gamePhase}</p>
            <p>脅威レベル: {threatLevel}</p>
            <p>手数: {currentSquares.filter(s => s !== null).length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ヘルパー関数
function calculateWinner(squares: SquareValue[]): SquareValue {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

function calculateWinnerWithLine(squares: SquareValue[]): { winner: SquareValue; line?: number[] } | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]
  for (const line of lines) {
    const [a, b, c] = line
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line }
    }
  }
  return null
}

function calculateWinProbability(squares: SquareValue[]): number {
  const emptyCount = squares.filter(s => s === null).length
  if (emptyCount === 0) return 50

  // 簡易的な勝率計算
  const winner = calculateWinner(squares)
  if (winner === 'X') return 100
  if (winner === 'O') return 0

  return 50 // より詳細な計算は省略
}

function detectFork(): boolean {
  // フォーク検出ロジック（簡易版）
  return false
}

function detectBlockableFork(): boolean {
  // ブロック可能なフォーク検出（簡易版）
  return false
}

function countCornerControl(squares: SquareValue[]): { X: number; O: number } {
  const corners = [0, 2, 6, 8]
  let xCount = 0
  let oCount = 0

  for (const corner of corners) {
    if (squares[corner] === 'X') xCount++
    if (squares[corner] === 'O') oCount++
  }

  return { X: xCount, O: oCount }
}

function analyzePossibleOutcomes(): { win: number; lose: number; draw: number } {
  // 可能な結果の分析（簡易版）
  return { win: 33, lose: 33, draw: 34 }
}

function generateStrategicRecommendation(
  phase: GamePhase,
  criticalPositions: number[]
): string {
  if (criticalPositions.length > 0) {
    return "クリティカルな位置に注意！"
  }

  if (phase === 'opening') {
    return "センターまたはコーナーを狙う"
  }

  if (phase === 'middle') {
    return "フォークを作るか、相手のフォークをブロック"
  }

  return "最適な手を選択"
}