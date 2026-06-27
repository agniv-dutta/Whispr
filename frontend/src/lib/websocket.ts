type EventCallback = (data: Record<string, unknown>) => void;

export class WhisprSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private url: string;
  private listeners = new Map<string, Set<EventCallback>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private retryDelay = 1000;
  private destroyed = false;
  private connectionAttempts = 0;

  private static instance: WhisprSocket | null = null;

  static getInstance(token: string): WhisprSocket {
    if (!WhisprSocket.instance || WhisprSocket.instance.token !== token) {
      WhisprSocket.instance?.destroy();
      WhisprSocket.instance = new WhisprSocket(token);
    }
    return WhisprSocket.instance;
  }

  static resetInstance(): void {
    WhisprSocket.instance?.destroy();
    WhisprSocket.instance = null;
  }

  private constructor(token: string) {
    this.token = token;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.hostname;
    this.url = `${proto}://${host}:8000/ws?token=${token}`;
    this.connect();
  }

  private connect(): void {
    if (this.destroyed) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.retryDelay = 1000;
      this.connectionAttempts = 0;
      this.emit("__connected", {});
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type) {
          this.emit(data.type, data);
        }
      } catch {}
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      if (!this.destroyed) {
        this.emit("__disconnected", {});
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectTimer) return;
    this.connectionAttempts++;
    const delay = Math.min(this.retryDelay * Math.pow(2, this.connectionAttempts - 1), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      this.send("ping", {});
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: Record<string, unknown>): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch {}
    });
  }

  send(type: string, payload: Record<string, unknown> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  destroy(): void {
    this.destroyed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}
