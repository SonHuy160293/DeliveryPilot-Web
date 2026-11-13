import { createContext } from "react";

/** Local form presentation only; never product or repository state. */
export const FormReadOnlyContext = createContext(false);
