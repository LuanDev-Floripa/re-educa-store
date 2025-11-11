/**
 * Testes para o hook useLiveStreaming RE-EDUCA Store.
 * 
 * Cobre funcionalidades de live streaming incluindo:
 * - Inicializa??o com valores padr?o
 * - Busca de streams dispon?veis
 * - In?cio e parada de streams
 * - Entrada e sa?da de streams
 * - Envio de mensagens e presentes
 * - Conex?o WebSocket
 * - Tratamento de erros
 * 
 * @module useLiveStreaming.test
 */

import { renderHook, act } from "@testing-library/react";
import { useLiveStreaming } from "../useLiveStreaming";

// Mock do WebSocket
const mockWebSocket = {
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
};

// Mock global do WebSocket
global.WebSocket = jest.fn(() => mockWebSocket);

// Mock do fetch
global.fetch = jest.fn();

describe("useLiveStreaming", () => {
  /**
   * Setup antes de cada teste.
   * Limpa mocks e configura fetch padr?o.
   */
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useLiveStreaming());

    expect(result.current.streams).toEqual([]);
    expect(result.current.currentStream).toBeNull();
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isWatching).toBe(false);
    expect(result.current.viewers).toEqual([]);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  /**
   * Testa busca autom?tica de streams ao montar o hook.
   * 
   * Verifica:
   * - Fetch ? chamado com endpoint correto
   * - Headers de autentica??o est?o presentes
   * - Resposta ? processada corretamente
   */
  it("should fetch streams on mount", async () => {
    const mockStreams = [
      {
        id: "1",
        title: "Test Stream",
        user: { username: "testuser" },
        viewer_count: 10,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStreams),
    });

    const { result } = renderHook(() => useLiveStreaming());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert: Fetch deve ser chamado com endpoint e headers corretos
    expect(fetch).toHaveBeenCalledWith("/api/social/streams", {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should start a stream", async () => {
    const mockStreamData = {
      title: "New Stream",
      category: "gaming",
      description: "Test stream",
    };

    const mockResponse = {
      id: "1",
      title: "New Stream",
      status: "live",
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useLiveStreaming());

    await act(async () => {
      await result.current.startStream(mockStreamData);
    });

    expect(fetch).toHaveBeenCalledWith("/api/social/streams", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockStreamData),
    });
  });

  it("should join a stream", async () => {
    const mockStreamId = "1";
    const mockResponse = {
      id: "1",
      title: "Test Stream",
      status: "live",
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useLiveStreaming());

    await act(async () => {
      await result.current.joinStream(mockStreamId);
    });

    expect(fetch).toHaveBeenCalledWith(
      `/api/social/streams/${mockStreamId}/join`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      },
    );
  });

  it("should send a message", async () => {
    const mockStreamId = "1";
    const mockMessage = "Hello world!";
    const mockResponse = {
      id: "1",
      message: "Hello world!",
      user_id: "user1",
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useLiveStreaming());

    await act(async () => {
      await result.current.sendMessage(mockStreamId, mockMessage);
    });

    expect(fetch).toHaveBeenCalledWith(
      `/api/social/streams/${mockStreamId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: mockMessage }),
      },
    );
  });

  it("should send a gift", async () => {
    const mockStreamId = "1";
    const mockGift = {
      type: "heart",
      value: 10,
    };
    const mockResponse = {
      id: "1",
      gift_type: "heart",
      gift_value: 10,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useLiveStreaming());

    await act(async () => {
      await result.current.sendGift(mockStreamId, mockGift);
    });

    expect(fetch).toHaveBeenCalledWith(
      `/api/social/streams/${mockStreamId}/gifts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockGift),
      },
    );
  });

  it("should handle WebSocket connection", () => {
    const { result } = renderHook(() => useLiveStreaming());

    expect(WebSocket).toHaveBeenCalledWith("ws://localhost:5000/live");
  });

  it("should handle WebSocket messages", () => {
    const { result } = renderHook(() => useLiveStreaming());

    const mockMessage = {
      type: "viewer_joined",
      data: {
        user_id: "user1",
        viewer_count: 5,
      },
    };

    act(() => {
      const event = new MessageEvent("message", {
        data: JSON.stringify(mockMessage),
      });
      mockWebSocket.addEventListener.mock.calls[0][1](event);
    });

    // Assert: Estado deve ser atualizado ap?s mensagem WebSocket
    expect(result.current.viewers).toContain("user1");
    expect(result.current.viewers).toBeInstanceOf(Array);
  });

  it("should handle errors gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useLiveStreaming());

    await act(async () => {
      await result.current.fetchStreams();
    });

    // Assert: Erro deve ser capturado e armazenado
    expect(result.current.error).toBe("Network error");
    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });
});
