import { type privacy_types } from "../../types/privacy";

// do not know if this is how it should be but its scaffolding
type universes_table = { 
  id: number
  title: string
  placeid: number
  places?: {
    [key: number]: any;
  }
  creator: number

  updatedat: EpochTimeStamp
  createdat: EpochTimeStamp
};

export type { universes_table };
