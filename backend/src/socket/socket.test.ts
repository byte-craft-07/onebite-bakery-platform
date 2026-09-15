import http from "node:http";
import type { AddressInfo } from "node:net";
import { io as ClientSocket, type Socket as ClientSocketType } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateAuthTokens } from "../modules/auth/utils/index.js";
import {
  broadcastNewOrderNotification,
  closeSocketServer,
  initSocketServer,
  type NewOrderSocketPayload,
} from "./socket.server.js";

describe("Socket.IO Real-Time Notification Server", () => {
  let httpServer: http.Server;
  let port: number;

  beforeAll(async () => {
    httpServer = http.createServer();
    initSocketServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address() as AddressInfo;
        port = address.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await closeSocketServer();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it("should reject connection without authentication token", async () => {
    const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ["websocket"],
      autoConnect: false,
    });

    const connectError = await new Promise<Error>((resolve) => {
      client.on("connect_error", (err) => resolve(err));
      client.connect();
    });

    expect(connectError.message).toMatch(/Authentication error/);
    client.disconnect();
  });

  it("should reject connection for customer role", async () => {
    const tokens = generateAuthTokens({
      userId: "661234567890123456789001",
      role: "customer",
      deviceId: "dev-customer",
    });

    const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ["websocket"],
      auth: { token: tokens.accessToken },
      autoConnect: false,
    });

    const connectError = await new Promise<Error>((resolve) => {
      client.on("connect_error", (err) => resolve(err));
      client.connect();
    });

    expect(connectError.message).toMatch(/Unauthorized role/);
    client.disconnect();
  });

  it("should authenticate and connect admin users successfully", async () => {
    const tokens = generateAuthTokens({
      userId: "661234567890123456789002",
      role: "admin",
      deviceId: "dev-admin-1",
    });

    const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ["websocket"],
      auth: { token: tokens.accessToken },
      autoConnect: false,
    });

    const connected = await new Promise<boolean>((resolve) => {
      client.on("connect", () => resolve(true));
      client.on("connect_error", () => resolve(false));
      client.connect();
    });

    expect(connected).toBe(true);
    expect(client.connected).toBe(true);
    client.disconnect();
  });

  it("should broadcast order:new event to all connected admins", async () => {
    // Admin 1
    const tokens1 = generateAuthTokens({
      userId: "661234567890123456789003",
      role: "admin",
      deviceId: "dev-admin-2",
    });
    const client1: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ["websocket"],
      auth: { token: tokens1.accessToken },
    });

    // Admin 2 (Multi-Admin test)
    const tokens2 = generateAuthTokens({
      userId: "661234567890123456789004",
      role: "admin",
      deviceId: "dev-admin-3",
    });
    const client2: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ["websocket"],
      auth: { token: tokens2.accessToken },
    });

    await Promise.all([
      new Promise<void>((resolve) => client1.on("connect", () => resolve())),
      new Promise<void>((resolve) => client2.on("connect", () => resolve())),
    ]);

    const testPayload: NewOrderSocketPayload = {
      notificationId: "notif-12345",
      orderId: "order-66123",
      orderNumber: "OB-20260907-TEST01",
      customer: {
        name: "Rahul Kumar",
        phone: "9876543210",
      },
      items: [
        { name: "Chocolate Truffle Cake", quantity: 1 },
        { name: "Fresh Butter Croissant", quantity: 2 },
      ],
      totalAmount: 899,
      paymentMethod: "COD",
      orderType: "HOME_DELIVERY",
      createdAt: new Date().toISOString(),
    };

    const receivedPromise1 = new Promise<NewOrderSocketPayload>((resolve) => {
      client1.on("order:new", (data) => resolve(data as NewOrderSocketPayload));
    });

    const receivedPromise2 = new Promise<NewOrderSocketPayload>((resolve) => {
      client2.on("order:new", (data) => resolve(data as NewOrderSocketPayload));
    });

    // Broadcast event
    broadcastNewOrderNotification(testPayload);

    const [received1, received2] = await Promise.all([
      receivedPromise1,
      receivedPromise2,
    ]);

    expect(received1.orderNumber).toBe("OB-20260907-TEST01");
    expect(received1.customer.name).toBe("Rahul Kumar");
    expect(received1.totalAmount).toBe(899);

    expect(received2.orderNumber).toBe("OB-20260907-TEST01");
    expect(received2.items).toHaveLength(2);

    client1.disconnect();
    client2.disconnect();
  });
});
