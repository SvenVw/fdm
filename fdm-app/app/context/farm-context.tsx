import { createContext, useContext } from "react";

interface FarmContextType {
  farmId: string | undefined;
  setFarmId: (farmId: string | undefined) => void;
}

export const FarmContext = createContext<FarmContextType>({
  farmId: undefined,
  setFarmId: () => {},
});

export const useFarm = () => useContext(FarmContext);