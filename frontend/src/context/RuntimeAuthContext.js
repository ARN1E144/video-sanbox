// src/context/RuntimeAuthContext.js

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "./AuthContext";

import {
  useRuntimeState,
} from "./RuntimeStateContext";

import {
  mapRuntimeRole,
} from "../runtime/auth/roles/runtimeRoleMapper";


// =====================================================
// CONTEXT
// =====================================================

const RuntimeAuthContext =
  createContext(null);


// =====================================================
// PROVIDER
// =====================================================

export function RuntimeAuthProvider({
  children,
}) {

  const {
    role,
    permissions,
  } =
    useAuth();


  const {
    get,
    subscribe,
  } =
    useRuntimeState();


  // ===================================================
  // PROJECT ROLE
  // ===================================================
  //
  // RuntimeAuthProvider sits ABOVE ProjectProvider.
  //
  // Therefore the project role may not exist during
  // the initial render.
  //
  // We initialise from RuntimeState and then subscribe
  // to project.access.role so RuntimeAuth updates when
  // ProjectContext hydrates the active project.
  //
  // ===================================================

  const [
    projectRole,
    setProjectRole,
  ] =
    useState(
      () =>
        get(
          "project.access.role"
        ) || null
    );


  // ===================================================
  // PROJECT ROLE SUBSCRIPTION
  // ===================================================

  useEffect(() => {

    const unsubscribe =
      subscribe(
        "project.access.role",
        (
          nextRole
        ) => {

          setProjectRole(
            nextRole ||
            null
          );

        }
      );


    return unsubscribe;

  }, [
    subscribe,
  ]);


  // ===================================================
  // RUNTIME ROLE MAPPING
  // ===================================================

  const runtime =
    useMemo(() => {

      return mapRuntimeRole({

        role:
          role ||
          "member",

        projectRole,

        permissions:
          permissions ||
          {},

      });

    }, [
      role,
      projectRole,
      permissions,
    ]);


  // ===================================================
  // DEBUG
  // ===================================================

  /*
  console.log(
    "[RUNTIME AUTH DEBUG]",
    {
      tenantRole:
        role,

      projectRole,

      runtimeRole:
        runtime.role,

      canBuild:
        runtime.canBuild,

      allowedElements:
        runtime.allowedElements?.length,

      allowedActions:
        runtime.allowedActions?.length,
    }
  );
  */


  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <RuntimeAuthContext.Provider
      value={
        runtime
      }
    >
      {children}
    </RuntimeAuthContext.Provider>
  );

}


// =====================================================
// HOOK
// =====================================================

export function useRuntimeAuth() {

  const ctx =
    useContext(
      RuntimeAuthContext
    );


  if (
    !ctx
  ) {

    throw new Error(
      "useRuntimeAuth must be inside RuntimeAuthProvider"
    );

  }


  return ctx;

}