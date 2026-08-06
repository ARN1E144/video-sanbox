import React, {
  createContext,
  useContext,
  useMemo
} from "react";

import { useAuth } from "./AuthContext";
import { mapRuntimeRole } from "../runtime/auth/roles/runtimeRoleMapper";


const RuntimeAuthContext = createContext(null);



export function RuntimeAuthProvider({children}) {

  const {
    role,
    permissions
  } = useAuth();


  const runtime = useMemo(()=>{

    return mapRuntimeRole({
      role: role || "member",
      permissions: permissions || {}
    });

  },[
    role,
    permissions
  ]);


  return (
    <RuntimeAuthContext.Provider value={runtime}>
      {children}
    </RuntimeAuthContext.Provider>
  );

}


export function useRuntimeAuth(){

 const ctx = useContext(RuntimeAuthContext);

 if(!ctx){
   throw new Error(
    "useRuntimeAuth must be inside RuntimeAuthProvider"
   );
 }

 return ctx;

}