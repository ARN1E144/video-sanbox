import dotenv from "dotenv";

dotenv.config();


// =====================================================
// ENVIRONMENT
// =====================================================

console.log(
  "[Server] OPENAI_API_KEY loaded:",
  Boolean(
    process.env.OPENAI_API_KEY
  )
);


import {
  requireEnv,
} from "./utils/requireEnv.js";


requireEnv([
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
]);


// =====================================================
// CORE
// =====================================================

import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";

import {
  Server as SocketIOServer,
} from "socket.io";


// =====================================================
// ROUTES
// =====================================================

import aiTemplateRoutes
  from "./routes/aiTemplates.js";

import agoraRoutes
  from "./routes/agora.js";

import aiRoutes
  from "./routes/aiRoutes.js";

import authRoutes
  from "./routes/authRoutes.js";

import tenantRoutes
  from "./routes/tenantRoutes.js";

import meRoutes
  from "./routes/me.js";

import callRoutes
  from "./routes/callRoutes.js";

import videoRoutes
  from "./routes/videoRoutes.js";

import projectRoutes
  from "./routes/projectRoutes.js";

import interviewRoutes
  from "./routes/interviewRoutes.js";

import dataHubRoutes
  from "./routes/dataHubRoutes.js";

import tenantMemberRoutes
  from "./routes/tenantMemberRoutes.js";

import trainingRoutes
  from "./routes/trainingRoutes.js";

import tenantInvitationRoutes
  from "./routes/tenantInvitationsRoutes.js";

import devRoutes
  from "./routes/devRoutes.js";

import groupCallRoutes
  from "./routes/groupCallRoutes.js";

import complianceRoutes
  from "./routes/complianceRoutes.js";


// =====================================================
// DATABASE
// =====================================================

import {
  connectWithRetry,
} from "./db/connect.js";


// =====================================================
// REALTIME
// =====================================================

import {
  registerGroupCallSockets,
} from "./realtime/groupCallSocket.js";


// =====================================================
// CONFIG
// =====================================================

const PORT =
  Number(
    process.env.PORT
  ) ||
  5000;


const allowedOrigins = [

  "http://localhost:3000",

  "http://192.168.0.111:3000",

];


// =====================================================
// EXPRESS
// =====================================================

const app =
  express();


// =====================================================
// CORS
// =====================================================

app.use(
  cors({

    origin:
      allowedOrigins,

    methods: [

      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",

    ],

    allowedHeaders: [

      "Content-Type",
      "Authorization",

    ],

    credentials:
      true,

  })
);


// =====================================================
// BODY PARSING
// =====================================================

app.use(
  bodyParser.json()
);


// =====================================================
// BASIC HEALTH / TEST ROUTES
// =====================================================

app.get(
  "/",
  (
    req,
    res
  ) => {

    res.send(
      "Video Sandbox API running..."
    );

  }
);


app.get(
  "/api/stream",
  (
    req,
    res
  ) => {

    res.json({

      data: {

        streamUrl:
          "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",

      },

    });

  }
);


// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api/agora",
  agoraRoutes
);


app.use(
  "/api/ai",
  aiRoutes
);


app.use(
  "/api/auth",
  authRoutes
);


app.use(
  "/api/tenant",
  tenantRoutes
);


app.use(
  "/api",
  meRoutes
);


app.use(
  "/api/calls",
  callRoutes
);


app.use(
  "/api/videos",
  videoRoutes
);


app.use(
  "/api/projects",
  projectRoutes
);


app.use(
  "/api",
  interviewRoutes
);


app.use(
  "/api/data",
  dataHubRoutes
);


app.use(
  "/api/data",
  tenantMemberRoutes
);


app.use(
  "/api/training",
  trainingRoutes
);


app.use(
  "/api/tenant",
  tenantInvitationRoutes
);


app.use(
  "/api/tenant",
  devRoutes
);


app.use(
  "/api/group-calls",
  groupCallRoutes
);

app.use(
  "/api/compliance",
  complianceRoutes
);


// =====================================================
// HTTP SERVER
// =====================================================
//
// Socket.IO MUST attach to this exact HTTP server.
//
// =====================================================

const server =
  http.createServer(
    app
  );


// =====================================================
// SOCKET.IO
// =====================================================
//
// One shared Socket.IO instance for:
//
//   Group Calls
//   Remote Training
//
// The same instance is:
//
//   1. attached to the HTTP server
//   2. exposed to Express as app.get("io")
//   3. passed to registerGroupCallSockets()
//
// This guarantees that training routes and realtime
// sockets operate against the exact same Socket.IO
// instance.
//
// =====================================================

const io =
  new SocketIOServer(
    server,
    {

      cors: {

        origin:
          allowedOrigins,

        methods: [

          "GET",
          "POST",

        ],

        credentials:
          true,

      },

      transports: [

        "websocket",

        "polling",

      ],

      pingInterval:
        25000,

      pingTimeout:
        20000,

    }
  );


// =====================================================
// EXPOSE IO TO EXPRESS
// =====================================================
//
// Routes such as:
//
//   trainingRoutes.js
//
// can access:
//
//   req.app.get("io")
//
// and therefore emit:
//
//   training-session:invited
//   training-session:started
//   training-session:ended
//
// =====================================================

app.set(
  "io",
  io
);


// =====================================================
// VERIFY IO REGISTRATION
// =====================================================

console.log(
  "[Socket.IO] instance created"
);


// =====================================================
// REGISTER REALTIME SOCKETS
// =====================================================
//
// This creates:
//
//   /group-calls
//
// namespace.
//
// The realtime module is responsible for:
//
//   - socket authentication
//   - user room membership
//   - group-call rooms
//   - training rooms
//   - lifecycle event delivery
//
// =====================================================

const groupCallNamespace =
  registerGroupCallSockets(
    io
  );


console.log(
  "[Socket.IO] /group-calls namespace registered",
  Boolean(
    groupCallNamespace
  )
);


// =====================================================
// DATABASE + SERVER STARTUP
// =====================================================

async function startServer() {

  try {

    // ===============================================
    // DATABASE
    // ===============================================

    await connectWithRetry(
      process.env.MONGODB_URI
    );


    console.log(
      "[Database] MongoDB connected"
    );


    // ===============================================
    // SERVER
    // ===============================================

    server.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          "================================================="
        );

        console.log(
          `[Server] API running on port ${PORT}`
        );

        console.log(
          "[Server] HTTP server listening on 0.0.0.0"
        );

        console.log(
          "[Socket.IO] server ready"
        );

        console.log(
          "[Socket.IO] namespace: /group-calls"
        );

        console.log(
          "================================================="
        );

      }
    );

  }
  catch (error) {

    console.error(
      "================================================="
    );

    console.error(
      "[Server] STARTUP FAILED"
    );

    console.error(
      error
    );

    console.error(
      "================================================="
    );


    process.exit(
      1
    );

  }

}


// =====================================================
// START
// =====================================================

await startServer();