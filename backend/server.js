import dotenv from "dotenv";
dotenv.config();

console.log(
  "OPENAI_API_KEY loaded:",
  !!process.env.OPENAI_API_KEY
);

import {
  requireEnv,
} from "./utils/requireEnv.js";

requireEnv([
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
]);

import express
  from "express";

import http
  from "http";

import cors
  from "cors";

import bodyParser
  from "body-parser";

import {
  Server as SocketIOServer,
} from "socket.io";

import aiTemplateRoutes
  from "./routes/aiTemplates.js";

import agoraRoutes
  from "./routes/agora.js";

import aiRoutes
  from "./routes/aiRoutes.js";

import authRoutes
  from "./routes/authRoutes.js";

import {
  connectWithRetry,
} from "./db/connect.js";

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

import {
  registerGroupCallSockets,
} from "./realtime/groupCallSocket.js";


// =====================================================
// EXPRESS
// =====================================================

const app =
  express();


// =====================================================
// CORS
// =====================================================

const allowedOrigins = [

  "http://localhost:3000",

  "http://192.168.0.111:3000",

];

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
// BODY
// =====================================================

app.use(
  bodyParser.json()
);


// =====================================================
// ROUTES
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


// =====================================================
// BASIC ROUTES
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
// HTTP SERVER
// =====================================================

const server =
  http.createServer(
    app
  );


// =====================================================
// SOCKET.IO
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

    }
  );


// =====================================================
// MAKE IO AVAILABLE TO EXPRESS ROUTES
// =====================================================
//
// IMPORTANT.
//
// groupCallRoutes.js uses:
//
//   req.app.get("io")
//
// Therefore the exact same Socket.IO instance must
// be exposed through the Express application.
//
// =====================================================

app.set(
  "io",
  io
);


// =====================================================
// REGISTER GROUP CALL SOCKETS
// =====================================================

registerGroupCallSockets(
  io
);


// =====================================================
// DATABASE
// =====================================================

await connectWithRetry(
  process.env.MONGODB_URI
);


// =====================================================
// START
// =====================================================

const PORT =
  process.env.PORT ||
  5000;


server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      "[Socket.IO] server ready"
    );

  }
);