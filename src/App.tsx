import { useState, useEffect } from 'react'
import { useCopilotAction, useCopilotReadable, useCopilotChat } from '@copilotkit/react-core'
import { TextMessage, MessageRole } from '@copilotkit/runtime-client-gql'
import './App.css'

type SquareValue = 'X' | 'O' | null

interface SquareProps {
  value: SquareValue
  onSquareClick: () => void
}

function Square({ value, onSquareClick }: SquareProps) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  )
}

interface BoardProps {
  xIsNext: boolean
  squares: SquareValue[]
  onPlay: (nextSquares: SquareValue[]) => void
}

function Board({ xIsNext, squares, onPlay }: BoardProps) {
  function handleClick(i: number) {
    if (calculateWinner(squares) || squares[i]) {
      return
    }
    const nextSquares = squares.slice()
    if (xIsNext) {
      nextSquares[i] = 'X'
    } else {
      nextSquares[i] = 'O'
    }
    onPlay(nextSquares)
  }

  const winner = calculateWinner(squares)
  let status: string
  if (winner) {
    status = '勝者: ' + winner
  } else {
    status = '次のプレイヤー: ' + (xIsNext ? 'X' : 'O')
  }

  return (
    <div className='board'>
      <div className="status">{status}</div>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </div>
  )
}

export default function Game() {
  const [history, setHistory] = useState<SquareValue[][]>([Array(9).fill(null)])
  const [currentMove, setCurrentMove] = useState(0)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const xIsNext = currentMove % 2 === 0
  const currentSquares = history[currentMove]
  const winner = calculateWinner(currentSquares)
  const { appendMessage } = useCopilotChat()

  // Share game state with AI
  useCopilotReadable({
    description: "○×ゲームの現在の状態",
    value: {
      board: currentSquares.map((value, index) => ({
        position: index,
        value: value || '空き'
      })),
      currentPlayer: xIsNext ? 'X (人間)' : 'O (AI)',
      gameStatus: winner ? `勝者: ${winner}` : currentSquares.every(square => square !== null) ? '引き分け' : '進行中',
      availableMoves: currentSquares
        .map((value, index) => value === null ? index : null)
        .filter(index => index !== null)
    }
  })

  // AI action to make a move
  useCopilotAction({
    name: "makeMove",
    description: "○×ゲームのボードに手を打つ",
    parameters: [
      {
        name: "position",
        type: "number",
        description: "AIがマークを置きたい位置（0-8）",
        required: true
      }
    ],
    handler: ({ position }) => {
      if (xIsNext) {
        return "今は人間プレイヤー（X）のターンです。相手の手を待ってください。"
      }
      if (winner || currentSquares.every(square => square !== null)) {
        return "ゲームはすでに終了しています。新しいゲームを開始してください。"
      }
      if (currentSquares[position] !== null) {
        return `位置 ${position} はすでに埋まっています。空いている位置を選んでください。`
      }

      const nextSquares = currentSquares.slice()
      nextSquares[position] = 'O'
      handlePlay(nextSquares)
      return `AIが位置 ${position} にOを置きました`
    }
  })

  // Auto-trigger AI move
  useCopilotReadable({
    description: "AIターントリガー",
    value: {
      isAITurn: !xIsNext && !winner && !currentSquares.every(square => square !== null),
      message: !xIsNext && !winner && !currentSquares.every(square => square !== null)
        ? "あなたのターンです（O）。ボードを分析して、makeMoveアクションを使って戦略的な手を打ってください。"
        : null
    }
  })

  // CopilotKitに自動でメッセージを送信
  useEffect(() => {
    const sendAITurnMessage = async () => {
      if (!xIsNext && !winner && !currentSquares.every(square => square !== null)) {
        setIsAIThinking(true)

        // CopilotKitのチャットにメッセージを送信
        const message = new TextMessage({
          role: MessageRole.User,
          content: 'あなたのターンです。ボードを分析して、最善の手を打ってください。makeMoveアクションを使用してください。',
        })

        await appendMessage(message)

        // AIが考えている感じを出すため少し待機
        const timer = setTimeout(() => {
          setIsAIThinking(false)
        }, 500)

        return () => clearTimeout(timer)
      }
    }

    sendAITurnMessage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xIsNext, winner, currentSquares])

  function handlePlay(nextSquares: SquareValue[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares]
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)
  }

  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove)
  }

  const moves = history.map((_squares, move) => {
    let description: string
    if (move > 0) {
      description = '手順 #' + move + ' へ移動'
    } else {
      description = 'ゲーム開始へ戻る'
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    )
  })

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
        {isAIThinking && <div style={{ marginTop: '10px' }}>AIが考えています...</div>}
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  )
}

function calculateWinner(squares: SquareValue[]): SquareValue {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}
