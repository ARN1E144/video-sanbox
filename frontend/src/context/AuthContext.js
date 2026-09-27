// src/context/AuthContext.jsx

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  authApi,
} from "../services/authApi";

import {
  setApiToken,
} from "../services/api";


const AuthContext =
  createContext(null);


const LS_KEY =
  "vs_auth";


export function AuthProvider({
  children,
}) {

  const [
    session,
    setSession,
  ] =
    useState(null);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /* --------------------------------------------
   * Hydrate session on boot
   * ------------------------------------------ */

  useEffect(() => {

    const hydrate =
      async () => {

        try {

          const raw =
            localStorage.getItem(
              LS_KEY
            );


          if (
            !raw
          ) {

            setSession(null);

            return;

          }


          const stored =
            JSON.parse(raw);


          const token =
            stored?.tokens?.accessToken;


          if (
            !token
          ) {

            setSession(
              stored
            );

            return;

          }


          // ------------------------------------------
          // Prime axios BEFORE any API calls
          // ------------------------------------------

          setApiToken(
            token
          );


          // ------------------------------------------
          // Re-validate session
          // ------------------------------------------

          const meRes =
            await authApi.me();


          const nextSession = {

            ...stored,

            me:
              meRes.data,

          };


          setSession(
            nextSession
          );


          localStorage.setItem(
            LS_KEY,
            JSON.stringify(
              nextSession
            )
          );

        }
        catch (err) {

          console.warn(
            "[Auth] hydration failed, clearing session",
            err
          );


          localStorage.removeItem(
            LS_KEY
          );


          setSession(null);

        }
        finally {

          setLoading(false);

        }

      };


    hydrate();

  }, []);


  /* --------------------------------------------
   * Session helpers
   * ------------------------------------------ */

  const save = (
    next
  ) => {

    setSession(
      next
    );


    localStorage.setItem(
      LS_KEY,
      JSON.stringify(
        next
      )
    );

  };


  const mergeSave = (
    patch
  ) => {

    setSession(
      (prev) => {

        const next = {

          ...(prev || {}),

          ...(patch || {}),

        };


        localStorage.setItem(
          LS_KEY,
          JSON.stringify(
            next
          )
        );


        return next;

      }
    );

  };


  const logout = () => {

    localStorage.removeItem(
      LS_KEY
    );


    setSession(
      null
    );


    // Hard reset guarantees clean slate
    // (Agora, canvas, tenant, etc.)

    window.location.reload();

  };


  /* --------------------------------------------
   * Derived auth state + actions
   * ------------------------------------------ */

  const value =
    useMemo(() => {

      const token =
        session?.tokens?.accessToken ||
        null;


      const tenantId =
        session?.me?.membership?.tenantId ||
        session?.membership?.tenantId ||
        session?.tenant?.id ||
        null;


      const role =
        session?.me?.membership?.role ||
        session?.membership?.role ||
        session?.auth?.role ||
        null;


      const permissions =
        session?.me?.membership?.permissions ||
        session?.membership?.permissions ||
        null;


      const canBuild =
        permissions?.canBuild ??
        (
          role === "owner" ||
          role === "admin" ||
          role === "builder"
        );


      const canInvite =
        permissions?.canInvite ??
        (
          role === "owner" ||
          role === "admin"
        );


      // ------------------------------------------
      // Refresh /me
      // ------------------------------------------

      const refreshMe =
        async () => {

          if (
            !token
          ) {

            throw new Error(
              "No access token"
            );

          }


          setApiToken(
            token
          );


          const res =
            await authApi.me();


          mergeSave({
            me:
              res.data,
          });


          return res.data;

        };


      // ------------------------------------------
      // Register
      // ------------------------------------------

      const register =
        async (
          payload
        ) => {

          const res =
            await authApi.register(
              payload
            );


          const data =
            res.data;


          const nextToken =
            data?.tokens?.accessToken;


          if (
            !nextToken
          ) {

            save(
              data
            );


            return data;

          }


          setApiToken(
            nextToken
          );


          const meRes =
            await authApi.me();


          save({

            ...data,

            me:
              meRes.data,

          });


          return data;

        };


      // ------------------------------------------
      // Login
      // ------------------------------------------

      const login =
        async (
          payload
        ) => {

          const res =
            await authApi.login(
              payload
            );


          const data =
            res.data;


          console.log(
            "[Auth] LOGIN RESPONSE:",
            data
          );


          const nextToken =
            data?.tokens?.accessToken;


          if (
            !nextToken
          ) {

            console.error(
              "[Auth] Login succeeded but no access token was returned"
            );


            save(
              data
            );


            return data;

          }


          console.log(
            "[Auth] Access token received"
          );


          // ----------------------------------------
          // Save token BEFORE /me.
          //
          // api.js request interceptor reads the
          // token from localStorage.
          // ----------------------------------------

          save(
            data
          );


          // Also prime Axios immediately.

          setApiToken(
            nextToken
          );


          console.log(
            "[Auth] Token stored and Axios configured"
          );


          // ----------------------------------------
          // Now /me can authenticate successfully.
          // ----------------------------------------

          const meRes =
            await authApi.me();


          const nextSession = {

            ...data,

            me:
              meRes.data,

          };


          save(
            nextSession
          );


          console.log(
            "[Auth] Session hydrated successfully"
          );


          return data;

        };


      // ------------------------------------------
      // Adopt an already-authenticated session
      // ------------------------------------------
      //
      // Used by invitation acceptance.
      //
      // The backend has already:
      //
      //   - authenticated the user
      //   - created Membership
      //   - created ProjectMembership
      //   - issued access/refresh tokens
      //
      // We therefore establish that session here
      // rather than creating a second auth mechanism.
      // ------------------------------------------

      const adoptSession =
        async ({
          tokens,
          user,
          membership,
        }) => {

          if (
            !tokens?.accessToken
          ) {

            throw new Error(
              "Cannot adopt session without an access token"
            );

          }


          // ----------------------------------------
          // Prime Axios immediately.
          // ----------------------------------------

          setApiToken(
            tokens.accessToken
          );


          // ----------------------------------------
          // Preserve the same session shapes already
          // supported by this AuthContext.
          //
          // membership is kept at the top level,
          // while /me can subsequently hydrate the
          // canonical `me` object.
          // ----------------------------------------

          const nextSession = {

            tokens,

            user,

            membership,

          };


          // ----------------------------------------
          // Persist BEFORE authenticated application
          // components begin making API requests.
          // ----------------------------------------

          localStorage.setItem(
            LS_KEY,
            JSON.stringify(
              nextSession
            )
          );


          setSession(
            nextSession
          );


          return nextSession;

        };


      return {

        session,

        loading,


        token,

        tenantId,

        role,

        permissions,

        canBuild,

        canInvite,


        login,

        register,

        refreshMe,

        me:
          refreshMe,

        adoptSession,

        logout,

      };

    }, [
      session,
      loading,
    ]);


  return (

    <AuthContext.Provider
      value={
        value
      }
    >

      {children}

    </AuthContext.Provider>

  );

}


export function useAuth() {

  const ctx =
    useContext(
      AuthContext
    );


  if (
    !ctx
  ) {

    throw new Error(
      "useAuth must be used inside <AuthProvider>"
    );

  }


  return ctx;

}