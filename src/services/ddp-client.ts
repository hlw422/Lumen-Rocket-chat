// ============================================================
// Rocket.Chat DDP (WebSocket) 实时消息客户端
// 基于 Meteor DDP 协议，实现 stream-room-messages 订阅
// ============================================================

import type { RCMessage } from '@/types/rocket'

/** DDP 消息回调：收到新消息 */
export type DdpMessageCallback = (msg: RCMessage) => void

/** DDP 连接状态回调 */
export type DdpStatusCallback = (status: DdpStatus) => void

export type DdpStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface PendingCall {
  resolve: (value: any) => void
  reject: (reason: any) => void
}

class RocketChatDDPClient {
  private ws: WebSocket | null = null
  private url = ''
  private userId = ''
  private authToken = ''
  private sessionId = ''
  private callId = 0
  private subIdCounter = 0
  private connected = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000

  /** 房间订阅: roomId → { subId, callback } */
  private roomSubs = new Map<string, { subId: string; callback: DdpMessageCallback }>()

  /** 等待响应的 method call */
  private pending = new Map<string, PendingCall>()

  /** 状态回调列表 */
  private statusCallbacks: DdpStatusCallback[] = []

  /**
   * 连接到 Rocket.Chat WebSocket
   */
  connect(wsUrl: string, userId: string, authToken: string): void {
    // 如果已有连接且参数相同，不重复连接
    if (this.ws && this.url === wsUrl && this.userId === userId) return

    this.disconnect()
    this.url = wsUrl
    this.userId = userId
    this.authToken = authToken
    this.reconnectAttempts = 0

    this.doConnect()
  }

  /**
   * 断开连接，清理资源
   */
  disconnect(): void {
    this.connected = false
    this.clearTimers()
    this.roomSubs.clear()
    this.pending.clear()

    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.close()
      this.ws = null
    }

    this.notifyStatus('disconnected')
  }

  /**
   * 订阅某个房间的消息
   */
  subscribeRoom(roomId: string, callback: DdpMessageCallback): void {
    // 取消旧订阅
    this.unsubscribeRoom(roomId)

    const subId = `sub_${++this.subIdCounter}`
    this.roomSubs.set(roomId, { subId, callback })

    if (this.connected) {
      this.sendSubscribe(roomId, subId)
    }
    // 如果未连接，connect 后会在 onOpen 中批量重订阅
  }

  /**
   * 取消订阅某个房间
   */
  unsubscribeRoom(roomId: string): void {
    const entry = this.roomSubs.get(roomId)
    if (entry) {
      if (this.connected) {
        this.send({ msg: 'unsub', id: entry.subId })
      }
      this.roomSubs.delete(roomId)
    }
  }

  /**
   * 监听连接状态
   */
  onStatus(cb: DdpStatusCallback): () => void {
    this.statusCallbacks.push(cb)
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((c) => c !== cb)
    }
  }

  // ---- 内部方法 ----

  private notifyStatus(status: DdpStatus): void {
    this.statusCallbacks.forEach((cb) => cb(status))
  }

  private doConnect(): void {
    this.notifyStatus('connecting')

    try {
      this.ws = new WebSocket(this.url)
      this.ws.onopen = () => this.onOpen()
      this.ws.onmessage = (e) => this.onMessage(e.data)
      this.ws.onclose = (e) => this.onClose(e)
      this.ws.onerror = () => {
        this.notifyStatus('error')
      }
    } catch (err) {
      console.error('[DDP] WebSocket creation failed:', err)
      this.notifyStatus('error')
      this.scheduleReconnect()
    }
  }

  private onOpen(): void {
    console.log('[DDP] WebSocket opened, sending connect...')
    this.send({
      msg: 'connect',
      version: '1',
      support: ['1', 'pre2', 'pre1']
    })
  }

  private onClose(event: CloseEvent): void {
    this.connected = false
    this.pending.clear()
    this.clearTimers()
    console.log('[DDP] WebSocket closed:', event.code, event.reason)

    // 非正常关闭时尝试重连
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.notifyStatus('disconnected')
      this.scheduleReconnect()
    } else {
      this.notifyStatus('disconnected')
    }
  }

  private onMessage(rawData: string): void {
    try {
      const data = JSON.parse(rawData)

      switch (data.msg) {
        case 'connected':
          this.sessionId = data.session || ''
          console.log('[DDP] Connected, session:', this.sessionId)
          this.login()
          break

        case 'result':
          this.handleResult(data)
          break

        case 'ready':
          // 订阅就绪
          console.log('[DDP] Subscription ready:', data.subs)
          break

        case 'changed':
          this.handleChanged(data)
          break

        case 'ping':
          this.send({ msg: 'pong' })
          break

        case 'nosub':
          console.warn('[DDP] No subscription:', data.id)
          break

        default:
          // 忽略其他消息
          break
      }
    } catch (err) {
      console.error('[DDP] Failed to parse message:', err)
    }
  }

  /**
   * 使用 resume token 登录
   */
  private login(): void {
    const id = this.nextCallId()
    console.log('[DDP] Logging in with resume token...')

    this.send({
      msg: 'method',
      method: 'login',
      params: [{ resume: this.authToken }],
      id
    })
  }

  /**
   * 处理 method call 的响应
   */
  private handleResult(data: any): void {
    const pending = this.pending.get(data.id)
    if (pending) {
      this.pending.delete(data.id)
      if (data.error) {
        pending.reject(new Error(data.error.reason || data.error.message || 'DDP error'))
      } else {
        pending.resolve(data.result)
      }
      return
    }

    // login 的 result（未注册 pending 的情况）
    if (data.result && data.result.id) {
      console.log('[DDP] Login successful, userId:', data.result.id)
      this.connected = true
      this.notifyStatus('connected')

      // 重订阅所有之前的房间
      this.resubscribeAll()

      // 启动心跳
      this.startPing()
    }
  }

  /**
   * 处理 stream-room-messages 的 changed 事件
   */
  private handleChanged(data: any): void {
    if (data.collection !== 'stream-room-messages') return

    const fields = data.fields
    if (!fields || !fields.args || !Array.isArray(fields.args)) return

    for (const msgPayload of fields.args) {
      if (!msgPayload || !msgPayload._id) continue

      const roomId = msgPayload.rid
      if (!roomId) continue

      const entry = this.roomSubs.get(roomId)
      if (entry) {
        // 转换为 RCMessage 并回调
        const rcMsg: RCMessage = {
          _id: msgPayload._id,
          rid: msgPayload.rid,
          msg: msgPayload.msg ?? '',
          ts: msgPayload.ts?.$date
            ? new Date(msgPayload.ts.$date).toISOString()
            : msgPayload.ts ?? new Date().toISOString(),
          u: msgPayload.u || { _id: '', username: 'unknown' },
          t: msgPayload.t,
          attachments: msgPayload.attachments,
          editedAt: msgPayload.editedAt,
          editedBy: msgPayload.editedBy
        }

        entry.callback(rcMsg)
      }
    }
  }

  private handleMethodResult(data: any, id: string): void {
    const pending = this.pending.get(id)
    if (pending) {
      this.pending.delete(id)
      if (data.error) {
        pending.reject(new Error(data.error.reason || 'DDP error'))
      } else {
        pending.resolve(data.result)
      }
    }
  }

  private resubscribeAll(): void {
    for (const [roomId, entry] of this.roomSubs) {
      this.sendSubscribe(roomId, entry.subId)
    }
  }

  private sendSubscribe(roomId: string, subId: string): void {
    this.send({
      msg: 'sub',
      id: subId,
      name: 'stream-room-messages',
      params: [roomId, false]
    })
  }

  private send(data: Record<string, any>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private nextCallId(): string {
    return `${++this.callId}`
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send({ msg: 'pong' })
    }, 30000)
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    )
    this.reconnectAttempts++

    console.log(`[DDP] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`)
    this.reconnectTimer = setTimeout(() => {
      if (this.connected) return
      this.doConnect()
    }, delay)
  }
}

/** 全局单例 */
export const ddpClient = new RocketChatDDPClient()
